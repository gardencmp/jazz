#!/usr/bin/env node
import { Command, Options } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect } from "effect";
import {
    websocketReadableStream,
    websocketWritableStream,
} from "cojson-transport-nodejs-ws";
import { WebSocket } from "ws";
import { Account, jazzReady } from "jazz-tools";
import { webcrypto } from "node:crypto";

const jazzTools = Command.make("jazz-tools");

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

const name = Options.text("name").pipe(Options.withAlias("n"));
const peer = Options.text("peer")
    .pipe(Options.withAlias("p"))
    .pipe(Options.withDefault("wss://mesh.jazz.tools"));
const accountCreate = Command.make(
    "create",
    { name, peer },
    ({ name, peer }) => {
        return Effect.gen(function* () {
            const ws = new WebSocket(peer);

            const account = yield* Effect.promise(() =>
                jazzReady.then(() =>
                    Account.create({
                        creationProps: { name },
                        peersToLoadFrom: [
                            {
                                id: "upstream",
                                role: "server",
                                incoming: websocketReadableStream(ws),
                                outgoing: websocketWritableStream(ws),
                            },
                        ],
                    })
                )
            );

            yield* Console.log(`# Credentials for Jazz account "${name}":
JAZZ_WORKER_ACCOUNT=${account.id}
JAZZ_WORKER_SECRET=${account._raw.agentSecret}
`);
        });
    }
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
    NodeRuntime.runMain
);
