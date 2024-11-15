import { co } from "../exports";
import { CoMap } from "./coMap";

/** @category Identity & Permissions */

export class Profile extends CoMap {
  name = co.string;
}
