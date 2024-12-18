import { RawCoMap } from "cojson";
import { CoID } from "cojson";
import { co } from "../internal.js";
import { CoMap } from "./coMap.js";
import { Account } from "./account.js";
import { InboxRoot, InboxInvite, createInboxRoot } from "./inbox.js";

/** @category Identity & Permissions */
export class Profile extends CoMap {
  name = co.string;
  inbox = co.optional.json<CoID<InboxRoot>>();
  inboxInvite = co.optional.json<InboxInvite>();

  migrate(account: Account) {
    if (account.profile) {
      if (!account.profile.inbox) {
        const inboxRoot = createInboxRoot(account);
        account.profile.inbox = inboxRoot.id;
        account.profile.inboxInvite = inboxRoot.inviteLink;
      }
    }
  }
}
