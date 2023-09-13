import { AccountID, CoID } from "cojson";
import { useTelepathicState } from "jazz-react";

import { PetPost, ReactionType, REACTION_TYPES, PetReactions } from "./1_types";

import { ShareButton } from "./components/ShareButton";
import { NameBadge } from "./components/NameBadge";
import { Button } from "./basicComponents";
import { useLoadImage } from "jazz-react-media-images";

/** Walkthrough: TODO
 */

const reactionEmojiMap: { [reaction in ReactionType]: string } = {
    aww: "😍",
    love: "❤️",
    haha: "😂",
    wow: "😮",
    tiny: "🐥",
    chonkers: "🐘",
};

export function RatePetPostUI({ petPostID }: { petPostID: CoID<PetPost> }) {
    const petPost = useTelepathicState(petPostID);
    const petReactions = useTelepathicState(petPost?.get("reactions"));
    const petImage = useLoadImage(petPost?.get("image"));

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between">
                <h1 className="text-3xl font-bold">{petPost?.get("name")}</h1>
                <ShareButton petPost={petPost} />
            </div>

            {petImage && (
                <img
                    className="w-80 max-w-full rounded"
                    src={petImage.highestResSrc || petImage.placeholderDataURL}
                />
            )}

            <div className="flex justify-between max-w-xs flex-wrap">
                {REACTION_TYPES.map((reactionType) => (
                    <Button
                        key={reactionType}
                        variant={
                            petReactions?.getLastItemFromMe() === reactionType
                                ? "default"
                                : "outline"
                        }
                        onClick={() => {
                            petReactions?.edit((reactions) => {
                                reactions.push(reactionType);
                            });
                        }}
                        title={`React with ${reactionType}`}
                        className="text-2xl px-2"
                    >
                        {reactionEmojiMap[reactionType]}
                    </Button>
                ))}
            </div>

            {petPost?.group.myRole() === "admin" && petReactions && (
                <ReactionOverview petReactions={petReactions} />
            )}
        </div>
    );
}

function ReactionOverview({ petReactions }: { petReactions: PetReactions }) {
    return (
        <div>
            <h2>Reactions</h2>
            <div className="flex flex-col gap-1">
                {REACTION_TYPES.map((reactionType) => {
                    const accountsWithThisReaction = Object.entries(
                        petReactions.getLastItemsPerAccount()
                    ).flatMap(([accountID, reaction]) =>
                        reaction === reactionType ? [accountID] : []
                    );

                    if (accountsWithThisReaction.length === 0) return null;

                    return (
                        <div
                            className="flex gap-2 items-center"
                            key={reactionType}
                        >
                            {reactionEmojiMap[reactionType]}{" "}
                            {accountsWithThisReaction.map((accountID) => (
                                <NameBadge
                                    key={accountID}
                                    accountID={accountID as AccountID}
                                />
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
