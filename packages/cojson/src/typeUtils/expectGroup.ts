import { expectMap, type CoValue } from "../coValue.js";
import { Group } from "../coValues/group.js";

export function expectGroup(content: CoValue): Group {
    const map = expectMap(content);
    if (map.core.header.ruleset.type !== "group") {
        throw new Error("Expected group ruleset in group");
    }

    if (!(map instanceof Group)) {
        throw new Error("Expected group");
    }

    return map;
}