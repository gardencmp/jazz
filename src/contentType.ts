import { JsonValue } from './jsonValue.js';
import { RawCoID } from './ids.js';
import { CoMap } from './contentTypes/coMap.js';
import { CoStream } from './contentTypes/coStream.js';
import { Static } from './contentTypes/static.js';
import { CoList } from './contentTypes/coList.js';

export type CoID<T extends ContentType> = RawCoID & {
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
