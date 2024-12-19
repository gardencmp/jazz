import { co } from "../internal.js";
import { CoMap } from "./coMap.js";

/** @category Identity & Permissions */
export class Profile extends CoMap {
  name = co.string;
}
