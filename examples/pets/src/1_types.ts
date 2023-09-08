import { CoMap, CoID, BinaryCoStream, CoStream } from "cojson";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of TODO
 *
 *  TODO
 **/

export type PetPost = CoMap<{
    name: string;
    image: CoID<BinaryCoStream>;
    reactions: CoID<PetReactions>;
}>;

export type ReactionType =
    | "aww"
    | "love"
    | "haha"
    | "wow"
    | "tiny"
    | "chonkers"
    | "good";

export type PetReactions = CoStream<ReactionType>;

/** Walkthrough: Continue with ./2_App.tsx */
