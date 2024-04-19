import {
    Account,
    CoList,
    CoMap,
    CoStream,
    ImageDefinition,
    Profile,
    val,
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

export class PetReactions extends CoStream.Of(val.json<ReactionType>()) {}

export class PetPost extends CoMap<PetPost> {
    name = val.string;
    image = val.ref(() => ImageDefinition);
    reactions = val.ref(() => PetReactions);
}

export class ListOfPosts extends CoList.Of(val.ref(() => PetPost)) {}

export class PetAccountRoot extends CoMap<PetAccountRoot> {
    posts = val.ref(() => ListOfPosts);
}

export class PetAccount extends Account<PetAccount> {
    profile = val.ref(() => Profile);
    root = val.ref(() => PetAccountRoot);

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

/** Walkthrough: Continue with ./2_App.tsx */
