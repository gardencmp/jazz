import { Command, Options } from "@effect/cli";
import { Console, Effect } from "effect";
import { createWebSocketPeer } from "cojson-transport-ws";
import { WebSocket } from "ws";
import {
    Account,
    Peer,
    WasmCrypto,
    createJazzContext,
    isControlledAccount,
} from "jazz-tools";
import { fixedCredentialsAuth, randomSessionProvider } from "jazz-tools";
import { CoValueCore } from "cojson";

const name = Options.text("name").pipe(Options.withAlias("n"));
const peer = Options.text("peer")
    .pipe(Options.withAlias("p"))
    .pipe(Options.withDefault("wss://cloud.jazz.tools"));

const accountCreate = Command.make(
    "create",
    { name, peer },
    ({ name, peer: peerAddr }) => {
        return Effect.gen(function* () {
            const crypto = yield* Effect.promise(() => WasmCrypto.create());

            const peer = createWebSocketPeer({
                id: "upstream",
                websocket: new WebSocket(peerAddr),
                role: "server",
            });

            const account: Account = yield* Effect.promise(async () =>
                Account.create({
                    creationProps: { name },
                    peersToLoadFrom: [peer],
                    crypto,
                }),
            );
            if (!isControlledAccount(account)) {
                throw new Error("account is not a controlled account");
            }

            const accountCoValue = account._raw.core;
            const accountProfileCoValue = account.profile!._raw.core;
            const syncManager = account._raw.core.node.syncManager;

            yield* Effect.promise(() =>
                syncManager.syncCoValue(accountCoValue),
            );
            yield* Effect.promise(() =>
                syncManager.syncCoValue(accountProfileCoValue),
            );

            yield* Effect.promise(() => Promise.all([
                waitForSync(account, peer, accountCoValue),
                waitForSync(account, peer, accountProfileCoValue),
            ]));

            // Spawn a second peer to double check that the account is fully synced
            const peer2 = createWebSocketPeer({
                id: "upstream2",
                websocket: new WebSocket(peerAddr),
                role: "server",
            });

            yield* Effect.promise(async () =>
                createJazzContext({
                    auth: fixedCredentialsAuth({
                        accountID: account.id,
                        secret: account._raw.agentSecret,
                    }),
                    sessionProvider: randomSessionProvider,
                    peersToLoadFrom: [peer2],
                    crypto,
                }),
            );

            yield* Console.log(`# Credentials for Jazz account "${name}":
JAZZ_WORKER_ACCOUNT=${account.id}
JAZZ_WORKER_SECRET=${account._raw.agentSecret}
`);
        });
    },
);

const accountBase = Command.make("account");

export const account = accountBase.pipe(Command.withSubcommands([accountCreate]));

function waitForSync(account: Account, peer: Peer, coValue: CoValueCore) {
    const syncManager = account._raw.core.node.syncManager;
    const peerState = syncManager.peers[peer.id];

    return new Promise((resolve) => {
        const unsubscribe = peerState?.optimisticKnownStates.subscribe((id, peerKnownState) => {
            if (id !== coValue.id) return;

            const knownState = coValue.knownState();

            const synced = isEqualSession(knownState.sessions, peerKnownState.sessions);
            if (synced) {
                resolve(true);
                unsubscribe?.();
            }
        });
    });
}

function isEqualSession(a: Record<string, number>, b: Record<string, number>) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
        return false;
    }

    for (const sessionId of keysA) {
        if (a[sessionId] !== b[sessionId]) {
            return false;
        }
    }

    return true;
}
