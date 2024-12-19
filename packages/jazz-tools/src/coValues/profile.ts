import { CoID } from "cojson";
import { co } from "../internal.js";
import { CoMap } from "./coMap.js";
import { InboxInvite, InboxRoot } from "./inbox.js";

/** @category Identity & Permissions */
export class Profile extends CoMap {
  name = co.string;
  inbox = co.optional.json<CoID<InboxRoot>>();
  inboxInvite = co.optional.json<InboxInvite>();
}
