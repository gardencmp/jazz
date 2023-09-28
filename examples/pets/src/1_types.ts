import {
    AccountMigration,
    CoList,
    CoMap,
    CoStream,
    Media,
    Profile,
} from "cojson";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of TODO
 *
 *  TODO
 **/

export type PetPost = CoMap<{
    name: string;
    image: Media.ImageDefinition["id"];
    reactions: PetReactions["id"];
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

export type ListOfPosts = CoList<PetPost["id"]>;

export type PetAccountRoot = CoMap<{
    posts: ListOfPosts["id"];
}>;

export const migration: AccountMigration<Profile, PetAccountRoot> = (account) => {
    if (!account.get("root")) {
        const root = account.createMap<PetAccountRoot>({
            posts: account.createList<ListOfPosts>().id,
        });
        account.set("root", root.id);
        console.log("Created root", root.id);
    }
};

/** Walkthrough: Continue with ./2_App.tsx */
