import { LocalNode, cojsonReady, ControlledAccount } from "cojson"
import { ListOfTwits, migration } from './1_dataModel'
import { websocketReadableStream,websocketWritableStream } from "cojson-transport-nodejs-ws"
import { WebSocket } from "ws";

await cojsonReady;

const { node } = await LocalNode.withNewlyCreatedAccount({
    name: "Bot" + Math.random().toString(36).slice(2),
    migration
});

const ws = new WebSocket("ws://localhost:4200");


ws.on("message", (data) => {
    console.log("Got", (new TextDecoder()).decode(data as ArrayBuffer))
});

const allTweetsGroup = (node.account as ControlledAccount).createGroup();
allTweetsGroup.addMember('everyone', 'writer');

const allTweets = allTweetsGroup.createList<ListOfTwits>();


node.syncManager.addPeer({
    id: "globalMesh",
    role: "server",
    incoming: websocketReadableStream(ws),
    outgoing: websocketWritableStream(ws),
});

console.log(allTweets.id);