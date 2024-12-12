import { CoMap, co } from "jazz-tools";

export class Game extends CoMap {
  status = co.literal("in progress", "done");
}
