import { Account, ImageDefinition, Profile, co } from "jazz-tools";

export class JazzProfile extends Profile {
  image = co.ref(ImageDefinition, { optional: true });
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
