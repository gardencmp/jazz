import {
  Account,
  CoFeed,
  CoList,
  CoMap,
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

export class PetReactions extends CoFeed.Of(co.json<ReactionType>()) {}

export class PetPost extends CoMap {
  name = co.string;
  image = co.ref(ImageDefinition);
  reactions = co.ref(PetReactions);
}

export class ListOfPosts extends CoList.Of(co.ref(PetPost)) {}

export class PetAccountRoot extends CoMap {
  posts = co.ref(ListOfPosts);
}

export class PetAccount extends Account {
  profile = co.ref(Profile);
  root = co.ref(PetAccountRoot);

  migrate(this: PetAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);
    if (!this._refs.root) {
      this.root = PetAccountRoot.create(
        {
          posts: ListOfPosts.create([], { owner: this }),
        },
        { owner: this },
      );
    }
  }
}

/** Walkthrough: Continue with ./2_App.tsx */
