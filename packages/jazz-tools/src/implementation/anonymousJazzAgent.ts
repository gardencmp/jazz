import { LocalNode } from "cojson";

export class AnonymousJazzAgent {
  _type = "Anonymous" as const;
  constructor(public node: LocalNode) {}
}
