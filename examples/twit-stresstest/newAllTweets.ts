import { ControlledAccount, LocalNode, cojsonReady } from "cojson";
import {
    ListOfTwits,
    migration,
} from "../twit/src/1_dataModel";
import { createOrResumeWorker, autoSub } from "jazz-nodejs"


const { localNode: node, worker } = await createOrResumeWorker(
    "TwitAllTwitsCreator"
);

const allTweetsGroup = worker.createGroup();
allTweetsGroup.addMember('everyone', 'writer');

const allTweets = allTweetsGroup.createList<ListOfTwits>();
console.log("allTweets", allTweets.id);