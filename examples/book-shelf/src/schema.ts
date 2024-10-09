import {
  CoMap,
  co,
  CoList,
  Account,
  Profile,
  ImageDefinition,
  Encoders,
} from "jazz-tools";

export class BookReview extends CoMap {
  title = co.string;
  author = co.string;
  rating = co.number;
  dateRead? = co.encoded(Encoders.Date);
  review? = co.string;
  cover? = co.ref(ImageDefinition, { optional: true });
}

export class ListOfBookReviews extends CoList.Of(co.ref(BookReview)) {}

/** The profile is an app-specific per-user public `CoMap`
 *  where you can store top-level objects for that user */
export class JazzProfile extends Profile {
  bookReviews = co.ref(ListOfBookReviews);
}

export class JazzAccount extends Account {
  profile = co.ref(JazzProfile);

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  migrate(this: JazzAccount, creationProps?: { name: string }) {
    super.migrate(creationProps);
  }
}
