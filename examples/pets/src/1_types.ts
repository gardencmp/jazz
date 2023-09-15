import { CoMap, CoStream, Media } from "cojson";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of TODO
 *
 *  TODO
 **/

export type PetPost = CoMap<{
    name: string;
    image: Media.ImageDefinition;
    reactions: PetReactions;
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
