import {
    CoValue,
    ID,
    AgentID,
    SessionID,
    cojsonInternals,
    InviteSecret,
    Account,
    CoValueClass,
    WasmCrypto,
    CryptoProvider,
} from "jazz-tools";
import { AccountID, LSMStorage } from "cojson";
import { AuthProvider } from "./auth/auth.js";
import { OPFSFilesystem } from "./OPFSFilesystem.js";
import { IDBStorage } from "cojson-storage-indexeddb";
import { Effect, Queue } from "effect";
import { createWebSocketPeer } from "cojson-transport-ws";
export * from "./auth/auth.js";

/** @category Context Creation */
export type BrowserContext<Acc extends Account> = {
    me: Acc;
    // TODO: Symbol.dispose?
    done: () => void;
};

/** @category Context Creation */
export async function createJazzBrowserContext<Acc extends Account>({
    auth,
    peer: peerAddr,
    reconnectionTimeout: initialReconnectionTimeout = 500,
    storage = "indexedDB",
    crypto: customCrypto,
}: {
    auth: AuthProvider<Acc>;
    peer: `wss://${string}` | `ws://${string}`;
    reconnectionTimeout?: number;
    storage?: "indexedDB" | "singleTabOPFS";
    crypto?: CryptoProvider;
}): Promise<BrowserContext<Acc>> {
    const crypto = customCrypto || (await WasmCrypto.create());
    let sessionDone: () => void;

    const firstWsPeer = await Effect.runPromise(
        createWebSocketPeer({
            websocket: new WebSocket(peerAddr),
            id: peerAddr + "@" + new Date().toISOString(),
            role: "server",
        }),
    );
    let shouldTryToReconnect = true;

    let currentReconnectionTimeout = initialReconnectionTimeout;

    function onOnline() {
        console.log("Online, resetting reconnection timeout");
        currentReconnectionTimeout = initialReconnectionTimeout;
    }

    window.addEventListener("online", onOnline);

    const me = await auth.createOrLoadAccount(
        (accountID) => {
            const sessionHandle = getSessionHandleFor(accountID);
            sessionDone = sessionHandle.done;
            return sessionHandle.session;
        },
        [
            storage === "indexedDB"
                ? await IDBStorage.asPeer()
                : await LSMStorage.asPeer({
                      fs: new OPFSFilesystem(crypto),
                      // trace: true,
                  }),
            firstWsPeer,
        ],
        await WasmCrypto.create(),
    );

    async function websocketReconnectLoop() {
        while (shouldTryToReconnect) {
            if (
                Object.keys(me._raw.core.node.syncManager.peers).some(
                    (peerId) => peerId.includes(peerAddr),
                )
            ) {
                // TODO: this might drain battery, use listeners instead
                await new Promise((resolve) => setTimeout(resolve, 100));
            } else {
                console.log(
                    "Websocket disconnected, trying to reconnect in " +
                        currentReconnectionTimeout +
                        "ms",
                );
                currentReconnectionTimeout = Math.min(
                    currentReconnectionTimeout * 2,
                    30000,
                );
                await new Promise<void>((resolve) => {
                    setTimeout(resolve, currentReconnectionTimeout);
                    window.addEventListener(
                        "online",
                        () => {
                            console.log(
                                "Online, trying to reconnect immediately",
                            );
                            resolve();
                        },
                        { once: true },
                    );
                });

                me._raw.core.node.syncManager.addPeer(
                    await Effect.runPromise(
                        createWebSocketPeer({
                            websocket: new WebSocket(peerAddr),
                            id: peerAddr + "@" + new Date().toISOString(),
                            role: "server",
                        }),
                    ),
                );
            }
        }
    }

    void websocketReconnectLoop();

    return {
        me,
        done: () => {
            shouldTryToReconnect = false;
            window.removeEventListener("online", onOnline);
            console.log("Cleaning up node");
            for (const peer of Object.values(
                me._raw.core.node.syncManager.peers,
            )) {
                void Effect.runPromise(Queue.shutdown(peer.outgoing));
            }
            sessionDone?.();
        },
    };
}

/** @category Auth Providers */
export type SessionProvider = (
    accountID: ID<Account> | AgentID,
) => Promise<SessionID>;

/** @category Auth Providers */
export type SessionHandle = {
    session: Promise<SessionID>;
    done: () => void;
};

export function getSessionHandleFor(
    accountID: ID<Account> | AgentID,
): SessionHandle {
    let done!: () => void;
    const donePromise = new Promise<void>((resolve) => {
        done = resolve;
    });

    let resolveSession: (sessionID: SessionID) => void;
    const sessionPromise = new Promise<SessionID>((resolve) => {
        resolveSession = resolve;
    });

    void (async function () {
        for (let idx = 0; idx < 100; idx++) {
            // To work better around StrictMode
            for (let retry = 0; retry < 2; retry++) {
                // console.debug("Trying to get lock", accountID + "_" + idx);
                const sessionFinishedOrNoLock = await navigator.locks.request(
                    accountID + "_" + idx,
                    { ifAvailable: true },
                    async (lock) => {
                        if (!lock) return "noLock";

                        const sessionID =
                            localStorage[accountID + "_" + idx] ||
                            cojsonInternals.newRandomSessionID(
                                accountID as AccountID | AgentID,
                            );
                        localStorage[accountID + "_" + idx] = sessionID;

                        // console.debug(
                        //     "Got lock",
                        //     accountID + "_" + idx,
                        //     sessionID
                        // );

                        resolveSession(sessionID);

                        await donePromise;
                        console.log(
                            "Done with lock",
                            accountID + "_" + idx,
                            sessionID,
                        );
                        return "sessionFinished";
                    },
                );

                if (sessionFinishedOrNoLock === "sessionFinished") {
                    return;
                }
            }
        }
        throw new Error("Couldn't get lock on session after 100x2 tries");
    })();

    return {
        session: sessionPromise,
        done,
    };
}

/** @category Invite Links */
export function createInviteLink<C extends CoValue>(
    value: C,
    role: "reader" | "writer" | "admin",
    // default to same address as window.location, but without hash
    {
        baseURL = window.location.href.replace(/#.*$/, ""),
        valueHint,
    }: { baseURL?: string; valueHint?: string } = {},
): string {
    const coValueCore = value._raw.core;
    let currentCoValue = coValueCore;

    while (currentCoValue.header.ruleset.type === "ownedByGroup") {
        currentCoValue = currentCoValue.getGroup().core;
    }

    if (currentCoValue.header.ruleset.type !== "group") {
        throw new Error("Can't create invite link for object without group");
    }

    const group = cojsonInternals.expectGroup(
        currentCoValue.getCurrentContent(),
    );
    const inviteSecret = group.createInvite(role);

    return `${baseURL}#/invite/${valueHint ? valueHint + "/" : ""}${
        value.id
    }/${inviteSecret}`;
}

/** @category Invite Links */
export function parseInviteLink<C extends CoValue>(
    inviteURL: string,
):
    | {
          valueID: ID<C>;
          valueHint?: string;
          inviteSecret: InviteSecret;
      }
    | undefined {
    const url = new URL(inviteURL);
    const parts = url.hash.split("/");

    let valueHint: string | undefined;
    let valueID: ID<C> | undefined;
    let inviteSecret: InviteSecret | undefined;

    if (parts[0] === "#" && parts[1] === "invite") {
        if (parts.length === 5) {
            valueHint = parts[2];
            valueID = parts[3] as ID<C>;
            inviteSecret = parts[4] as InviteSecret;
        } else if (parts.length === 4) {
            valueID = parts[2] as ID<C>;
            inviteSecret = parts[3] as InviteSecret;
        }

        if (!valueID || !inviteSecret) {
            return undefined;
        }
        return { valueID, inviteSecret, valueHint };
    }
}

/** @category Invite Links */
export function consumeInviteLinkFromWindowLocation<V extends CoValue>({
    as,
    forValueHint,
    invitedObjectSchema,
}: {
    as: Account;
    forValueHint?: string;
    invitedObjectSchema: CoValueClass<V>;
}): Promise<
    | {
          valueID: ID<V>;
          valueHint?: string;
          inviteSecret: InviteSecret;
      }
    | undefined
> {
    return new Promise((resolve, reject) => {
        const result = parseInviteLink<V>(window.location.href);

        if (result && result.valueHint === forValueHint) {
            as.acceptInvite(
                result.valueID,
                result.inviteSecret,
                invitedObjectSchema,
            )
                .then(() => {
                    resolve(result);
                    window.history.replaceState(
                        {},
                        "",
                        window.location.href.replace(/#.*$/, ""),
                    );
                })
                .catch(reject);
        } else {
            resolve(undefined);
        }
    });
}
