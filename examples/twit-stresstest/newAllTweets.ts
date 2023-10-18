import { ControlledAccount, LocalNode, cojsonReady } from "cojson";
import {
    ListOfTwits,
    migration,
} from "../twit/src/1_dataModel";
import {
    websocketReadableStream,
    websocketWritableStream,
} from "cojson-transport-nodejs-ws";
import { WebSocket } from "ws";

await cojsonReady;

const { node } = await LocalNode.withNewlyCreatedAccount({
    name: "Bot_" + Math.random().toString(36).slice(2),
    migration,
});

const ws = new WebSocket("ws://localhost:4200");

const allTweetsGroup = (node.account as ControlledAccount).createGroup();
allTweetsGroup.addMember('everyone', 'writer');

const allTweets = allTweetsGroup.createList<ListOfTwits>();
console.log("allTweets", allTweets.id);

node.syncManager.addPeer({
    id: "globalMesh",
    role: "server",
    incoming: websocketReadableStream(ws),
    outgoing: websocketWritableStream(ws),
});