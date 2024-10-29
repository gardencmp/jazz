#!/usr/bin/env node
/* istanbul ignore file -- @preserve */
import { Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";
import { account } from "./accountCreate.js";
import { startSync } from "./startSync.js";

const jazzTools = Command.make("jazz-tools");

const command = jazzTools.pipe(Command.withSubcommands([account, startSync]));

const cli = Command.run(command, {
    name: "Jazz CLI Tools",
    version: "v0.7.0",
});

Effect.suspend(() => cli(process.argv)).pipe(
    Effect.provide(NodeContext.layer),
    NodeRuntime.runMain,
);
