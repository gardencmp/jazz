import { co, CoMap } from "jazz-tools";

export class Doc extends CoMap {
  title = co.string;
  text = co.string;
  tweet = co.string;
}
