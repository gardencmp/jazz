import { co, CoMap } from "jazz-tools";

export class Page extends CoMap {
  title = co.string;
  text = co.string;
  tweet = co.string;
}
