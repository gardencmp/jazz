import { JsonObject, JsonValue } from "./jsonValue.js";
import { RawCoID } from "./ids.js";
import { CoMap } from "./contentTypes/coMap.js";
import { CoStream } from "./contentTypes/coStream.js";
import { Static } from "./contentTypes/static.js";
import { CoList } from "./contentTypes/coList.js";

export type CoID<T extends ContentType> = RawCoID & {
    readonly __type: T;
};

export type ContentType =
    | CoMap<{ [key: string]: JsonValue }, JsonObject | null>
    | CoList<JsonValue, JsonObject | null>
    | CoStream<JsonValue, JsonObject | null>
    | Static<JsonObject>;

export function expectMap(
    content: ContentType
): CoMap<{ [key: string]: string }, JsonObject | null> {
    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    return content as CoMap<{ [key: string]: string }, JsonObject | null>;
}
