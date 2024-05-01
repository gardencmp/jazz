import {
    Account,
    CoList,
    CoMap,
    CoStream,
    ImageDefinition,
    Profile,
    co,
} from "jazz-tools";

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

export class PetReactions extends CoStream.Of(co.json<ReactionType>()) {}

export class PetPost extends CoMap<PetPost> {
    name = co.string;
    image = co.ref(ImageDefinition);
    reactions = co.ref(PetReactions);
}

export class ListOfPosts extends CoList.Of(co.ref(PetPost)) {}

export class PetAccountRoot extends CoMap<PetAccountRoot> {
    posts = co.ref(ListOfPosts);
}

export class PetAccount extends Account<PetAccount> {
    profile = co.ref(Profile);
    root = co.ref(PetAccountRoot);

    migrate(creationProps?: { name: string }) {
        super.migrate(creationProps);
        if (!this._refs.root) {
            this.root = new PetAccountRoot(
                {
                    posts: new ListOfPosts([], { owner: this }),
                },
                { owner: this }
            );
            console.log("Created root", this.root);
        }
    }
}

/** Walkthrough: Continue with ./2_App.tsx */
