import { CoMap, CoID, CoStream, Media } from "cojson";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of TODO
 *
 *  TODO
 **/

export type PetPost = CoMap<{
    name: string;
    image: CoID<Media.ImageDefinition>;
    reactions: CoID<PetReactions>;
}>;

export const REACTION_TYPES = [
    "aww",
    "love",
    "haha",
    "wow",
    "tiny",
    "chonkers",
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export type PetReactions = CoStream<ReactionType>;

/** Walkthrough: Continue with ./2_App.tsx */
