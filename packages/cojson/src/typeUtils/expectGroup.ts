import { type RawCoValue, expectMap } from "../coValue.js";
import { RawGroup } from "../coValues/group.js";

export function expectGroup(content: RawCoValue): RawGroup {
  const map = expectMap(content);
  if (map.core.header.ruleset.type !== "group") {
    throw new Error("Expected group ruleset in group");
  }

  if (!(map instanceof RawGroup)) {
    throw new Error("Expected group");
  }

  return map;
}
