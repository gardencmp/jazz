import { Account, Profile, co } from "jazz-tools";

export class MinimalProfile extends Profile {
  name = co.string;
}

export class MinimalAccount extends Account {
  profile = co.ref(MinimalProfile);
}
