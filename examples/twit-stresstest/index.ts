import { LocalNode, cojsonReady, ControlledAccount, AccountID } from "cojson";
import {
    ALL_TWEETS_LIST_ID,
    LikeStream,
    ListOfTwits,
    ReplyStream,
    Twit,
    TwitAccountRoot,
    TwitProfile,
    migration,
} from "./1_dataModel";
import {
    websocketReadableStream,
    websocketWritableStream,
} from "cojson-transport-nodejs-ws";
import { WebSocket } from "ws";
import { autoSub } from "jazz-autosub";

await cojsonReady;

async function runner() {
    const { node } = await LocalNode.withNewlyCreatedAccount({
        name: "Bot_" + Math.random().toString(36).slice(2),
        migration,
    });

    const ws = new WebSocket("ws://localhost:4200");

    // ws.on("message", (data) => {
    //     console.log("Got", new TextDecoder().decode(data as ArrayBuffer));
    // });

    // const allTweetsGroup = (node.account as ControlledAccount).createGroup();
    // allTweetsGroup.addMember('everyone', 'writer');

    // const allTweets = allTweetsGroup.createList<ListOfTwits>();
    // console.log("allTweets", allTweets.id);

    node.syncManager.addPeer({
        id: "globalMesh",
        role: "server",
        incoming: websocketReadableStream(ws),
        outgoing: websocketWritableStream(ws),
    });

    console.log(
        "profile",
        node.expectProfileLoaded(node.account.id as AccountID).id
    );

    await new Promise((resolve) => setTimeout(resolve, 10_000));

    const loadedAllTwits = await node.load(ALL_TWEETS_LIST_ID);

    if (loadedAllTwits === "unavailable") {
        throw new Error("allTweets is unavailable");
    }

    let allTwits = loadedAllTwits;
    let startedPosting = false;

    autoSub(
        (node.account as ControlledAccount<TwitProfile, TwitAccountRoot>).id,
        node,
        async (me) => {
            if (
                !me?.root?.peopleWhoCanSeeMyTwits ||
                !me.root.peopleWhoCanInteractWithMe
            )
                return;
            if (startedPosting) return;
            startedPosting = true;
            for (let i = 0; i < 10; i++) {
                const audience = me.root.peopleWhoCanSeeMyTwits;
                const interactors = me.root.peopleWhoCanInteractWithMe;
                if (!audience || !interactors) return;

                console.log("Posting twit ", i);

                const twit = audience.createMap<Twit>({
                    text: "Hello world " + i,
                    likes: interactors.createStream<LikeStream>().id,
                    replies: interactors.createStream<ReplyStream>().id,
                });

                me.profile?.twits?.prepend(twit?.id as Twit["id"]);

                allTwits = allTwits?.prepend(twit.id);
                await new Promise((resolve) =>
                    setTimeout(resolve, Math.random() * 5000)
                );
            }
        }
    );

    let blackHole = 0;

    autoSub(ALL_TWEETS_LIST_ID, node, (allTwits) => {
        // console.log("All twits updated", new Date());

        // console.log(allTwits
        //     ?.slice(0, 20)
        //     .map(
        //         (twit) =>
        //             twit?.text +
        //             "/" +
        //             twit?.meta.edits.text?.by?.profile?.name
        //     )
        //     .length, allTwits?.length);

        blackHole +=
            allTwits
                ?.slice(0, 20)
                .map(
                    (twit) =>
                        twit?.text +
                        "/" +
                        twit?.meta.edits.text?.by?.profile?.name
                ).length || 0;
    });
}

for (let i = 0; i < 10; i++) {
    runner();
}
