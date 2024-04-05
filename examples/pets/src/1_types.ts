import { AccountMigration, BaseProfile, Co, S } from "jazz-js";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of TODO
 *
 *  TODO
 **/

export const ReactionTypes = [
    "aww",
    "love",
    "haha",
    "wow",
    "tiny",
    "chonkers",
] as const;
export const ReactionType = S.literal(...ReactionTypes);

export class PetReactions extends Co.stream(ReactionType).as<PetReactions>() {}

export class PetPost extends Co.map({
    name: S.string,
    image: Co.media.imageDef,
    reactions: PetReactions,
}).as<PetPost>() {}

export class ListOfPosts extends Co.list(PetPost).as<ListOfPosts>() {}

export class PetAccountRoot extends Co.map({
    posts: ListOfPosts,
}).as<PetAccountRoot>() {}

export class PetAccount extends Co.account({
    profile: BaseProfile,
    root: PetAccountRoot,
}).as<PetAccount>() {}

export const migration: AccountMigration<typeof PetAccount> = (me) => {
    if (!me.root) {
        me.root = new PetAccountRoot(
            {
                posts: new ListOfPosts([], { owner: me }),
            },
            { owner: me }
        );
        console.log("Created root", me.root);
    }
};

/** Walkthrough: Continue with ./2_App.tsx */
