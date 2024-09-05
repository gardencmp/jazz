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
    AuthMethod,
    createJazzContext,
    AnonymousJazzAgent,
} from "jazz-tools";
import { RawAccountID, LSMStorage } from "cojson";
import { OPFSFilesystem } from "./OPFSFilesystem.js";
import { IDBStorage } from "cojson-storage-indexeddb";
import { createWebSocketPeer } from "cojson-transport-ws";
export { BrowserDemoAuth } from "./auth/DemoAuth.js";
export { BrowserPasskeyAuth } from "./auth/PasskeyAuth.js";
export { BrowserPassphraseAuth } from "./auth/PassphraseAuth.js";

/** @category Context Creation */
export type BrowserContext<Acc extends Account> = {
    me: Acc;
    // TODO: Symbol.dispose?
    done: () => void;
};

export type BrowserGuestContext = {
    guest: AnonymousJazzAgent;
    done: () => void;
};

export type BrowserContextOptions<Acc extends Account> = {
    auth: AuthMethod;
    AccountSchema: CoValueClass<Acc> & {
        fromNode: (typeof Account)["fromNode"];
    };
} & BaseBrowserContextOptions;

export type BaseBrowserContextOptions = {
    peer: `wss://${string}` | `ws://${string}`;
    reconnectionTimeout?: number;
    storage?: "indexedDB" | "singleTabOPFS";
    crypto?: CryptoProvider;
};

/** @category Context Creation */
export async function createJazzBrowserContext<Acc extends Account>(
    options: BrowserContextOptions<Acc>,
): Promise<BrowserContext<Acc>>;
export async function createJazzBrowserContext(
    options: BaseBrowserContextOptions,
): Promise<BrowserGuestContext>;
export async function createJazzBrowserContext<Acc extends Account>(
    options: BrowserContextOptions<Acc> | BaseBrowserContextOptions,
): Promise<BrowserContext<Acc> | BrowserGuestContext>
export async function createJazzBrowserContext<Acc extends Account>(
    options: BrowserContextOptions<Acc> | BaseBrowserContextOptions,
): Promise<BrowserContext<Acc> | BrowserGuestContext> {
    const crypto = options.crypto || (await WasmCrypto.create());

    const firstWsPeer = createWebSocketPeer({
        websocket: new WebSocket(options.peer),
        id: options.peer + "@" + new Date().toISOString(),
        role: "server",
    });
    let shouldTryToReconnect = true;

    let currentReconnectionTimeout = options.reconnectionTimeout || 500;

    function onOnline() {
        console.log("Online, resetting reconnection timeout");
        currentReconnectionTimeout = options.reconnectionTimeout || 500;
    }

    window.addEventListener("online", onOnline);

    const context =
        "auth" in options
            ? await createJazzContext({
                  AccountSchema: options.AccountSchema,
                  auth: options.auth,
                  crypto: await WasmCrypto.create(),
                  peersToLoadFrom: [
                      options.storage === "indexedDB"
                          ? await IDBStorage.asPeer()
                          : await LSMStorage.asPeer({
                                fs: new OPFSFilesystem(crypto),
                                // trace: true,
                            }),
                      firstWsPeer,
                  ],
                  sessionProvider: provideBroswerLockSession,
              })
            : await createJazzContext({
                  crypto: await WasmCrypto.create(),
                  peersToLoadFrom: [
                      options.storage === "indexedDB"
                          ? await IDBStorage.asPeer()
                          : await LSMStorage.asPeer({
                                fs: new OPFSFilesystem(crypto),
                                // trace: true,
                            }),
                      firstWsPeer,
                  ],
              });

    const node =
        "account" in context
            ? context.account._raw.core.node
            : context.agent.node;

    async function websocketReconnectLoop() {
        while (shouldTryToReconnect) {
            if (
                Object.keys(node.syncManager.peers).some((peerId) =>
                    peerId.includes(options.peer),
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

                node.syncManager.addPeer(
                    createWebSocketPeer({
                        websocket: new WebSocket(options.peer),
                        id: options.peer + "@" + new Date().toISOString(),
                        role: "server",
                    }),
                );
            }
        }
    }

    void websocketReconnectLoop();

    return "account" in context
        ? {
              me: context.account,
              done: () => {
                  shouldTryToReconnect = false;
                  window.removeEventListener("online", onOnline);
                  context.done();
              },
          }
        : {
              guest: context.agent,
              done: () => {
                  shouldTryToReconnect = false;
                  window.removeEventListener("online", onOnline);
                  context.done();
              },
          };
}

/** @category Auth Providers */
export type SessionProvider = (
    accountID: ID<Account> | AgentID,
) => Promise<SessionID>;

export function provideBroswerLockSession(
    accountID: ID<Account> | AgentID,
    crypto: CryptoProvider,
) {
    let sessionDone!: () => void;
    const donePromise = new Promise<void>((resolve) => {
        sessionDone = resolve;
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
                            crypto.newRandomSessionID(
                                accountID as RawAccountID | AgentID,
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

    return sessionPromise.then((sessionID) => ({
        sessionID,
        sessionDone,
    }));
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
