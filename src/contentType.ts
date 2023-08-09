import { JsonValue } from "./jsonValue";
import { RawCoValueID } from "./ids";
import { CoMap } from "./contentTypes/coMap";
import { CoStream } from "./contentTypes/coStream";
import { Static } from "./contentTypes/static";
import { CoList } from "./contentTypes/coList";

export type CoValueID<T extends ContentType> = RawCoValueID & {
    readonly __type: T;
};

export type ContentType =
    | CoMap<{[key: string]: JsonValue}, JsonValue>
    | CoList<JsonValue, JsonValue>
    | CoStream<JsonValue, JsonValue>
    | Static<JsonValue>;

export function expectMap(content: ContentType): CoMap<{ [key: string]: string }, {}> {
    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    return content as CoMap<{ [key: string]: string }, {}>;
}
