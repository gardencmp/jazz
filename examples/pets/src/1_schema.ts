import { Co, Profile } from "jazz-tools";

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
export type ReactionType = (typeof ReactionTypes)[number];

export class PetReactions extends Co.Stream<ReactionType> {}
PetReactions.encoding({ _item: "json" });

export class PetPost extends Co.Map<PetPost> {
    declare name: string;
    declare image: Co.media.ImageDef | null;
    declare reactions: PetReactions | null;
}
PetPost.encoding({
    name: "json",
    image: { ref: () => Co.media.ImageDef },
    reactions: { ref: () => PetReactions },
});

export class ListOfPosts extends Co.List<PetPost | null> {}
ListOfPosts.encoding({ _item: { ref: () => PetPost } });

export class PetAccountRoot extends Co.Map<PetAccountRoot> {
    declare posts: ListOfPosts | null;
}
PetAccountRoot.encoding({ posts: { ref: () => ListOfPosts } });

export class PetAccount extends Co.Account<PetAccount> {
    declare profile: Profile | null;
    declare root: PetAccountRoot | null;

    migrate = () => {
        if (!this._refs.root) {
            this.root = new PetAccountRoot(
                {
                    posts: new ListOfPosts([], { owner: this }),
                },
                { owner: this }
            );
            console.log("Created root", this.root);
        }
    };
}
PetAccount.encoding({
    profile: { ref: () => Profile },
    root: { ref: () => PetAccountRoot },
});

/** Walkthrough: Continue with ./2_App.tsx */
