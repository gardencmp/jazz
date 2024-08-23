#!/usr/bin/env node
import { Command, Options } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect } from "effect";
import { createWebSocketPeer } from "cojson-transport-ws";
import { WebSocket } from "ws";
import {
    Account,
    WasmCrypto,
    cojsonInternals,
    isControlledAccount,
} from "jazz-tools";
import type { AccountID } from "cojson";

const jazzTools = Command.make("jazz-tools");

const name = Options.text("name").pipe(Options.withAlias("n"));
const peer = Options.text("peer")
    .pipe(Options.withAlias("p"))
    .pipe(Options.withDefault("wss://mesh.jazz.tools"));
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

            yield* Effect.promise(() =>
                account._raw.core.node.syncManager.syncCoValue(
                    account._raw.core,
                ),
            );
            yield* Effect.promise(() =>
                account._raw.core.node.syncManager.syncCoValue(
                    account.profile!._raw.core,
                ),
            );

            // TODO: remove this once we have a better way to wait for the sync
            yield* Effect.sleep(500);

            const peer2 = createWebSocketPeer({
                id: "upstream2",
                websocket: new WebSocket(peerAddr),
                role: "server",
            });

            yield* Effect.promise(async () =>
                Account.become({
                    accountID: account.id,
                    accountSecret: account._raw.agentSecret,
                    sessionID: cojsonInternals.newRandomSessionID(
                        account.id as unknown as AccountID,
                    ),
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

const account = accountBase.pipe(Command.withSubcommands([accountCreate]));

const command = jazzTools.pipe(Command.withSubcommands([account]));

const cli = Command.run(command, {
    name: "Jazz CLI Tools",
    version: "v0.7.0",
});

Effect.suspend(() => cli(process.argv)).pipe(
    Effect.provide(NodeContext.layer),
    NodeRuntime.runMain,
);
