import { JsonObject, JsonValue } from "./jsonValue.js";
import { RawCoID } from "./ids.js";
import { CoMap } from "./coValues/coMap.js";
import {
    BinaryCoStream,
    BinaryCoStreamMeta,
    CoStream,
} from "./coValues/coStream.js";
import { CoList } from "./coValues/coList.js";
import { CoValueCore } from "./coValueCore.js";
import { Group } from "./group.js";

export type CoID<T extends CoValue> = RawCoID & {
    readonly __type: T;
};

export interface CoValue {
    /** The `CoValue`'s (precisely typed) `CoID` */
    id: CoID<this>;
    core: CoValueCore;
    /** Specifies which kind of `CoValue` this is */
    type: string;
    /** The `CoValue`'s (precisely typed) static metadata */
    meta: JsonObject | null;
    /** The `Group` this `CoValue` belongs to (determining permissions) */
    group: Group;
    /** Returns an immutable JSON presentation of this `CoValue` */
    toJSON(): JsonValue;
    atTime(time: number): this;
    /** Lets you subscribe to future updates to this CoValue (whether made locally or by other users).
     *
     * Takes a listener function that will be called with the current state for each update.
     *
     * Returns an unsubscribe function.
     *
     * Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`. */
    subscribe(listener: (coValue: this) => void): () => void;
}

export type AnyCoMap = CoMap<
    { [key: string]: JsonValue | CoValue | undefined },
    JsonObject | null
>;

export type AnyCoList = CoList<JsonValue | CoValue, JsonObject | null>;

export type AnyCoStream = CoStream<JsonValue | CoValue, JsonObject | null>;

export type AnyBinaryCoStream = BinaryCoStream<BinaryCoStreamMeta>;


export type AnyCoValue =
    | AnyCoMap
    | AnyCoList
    | AnyCoStream
    | AnyBinaryCoStream

export function expectMap(
    content: CoValue
): AnyCoMap {
    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    return content as AnyCoMap;
}

export function expectList(
    content: CoValue
): AnyCoList {
    if (content.type !== "colist") {
        throw new Error("Expected list");
    }

    return content as AnyCoList;
}

export function expectStream(
    content: CoValue
): AnyCoStream {
    if (content.type !== "costream") {
        throw new Error("Expected stream");
    }

    return content as AnyCoStream;
}

export function isCoValue(value: JsonValue | CoValue | undefined) : value is CoValue {
    return (
        value instanceof CoMap ||
        value instanceof CoList ||
        value instanceof CoStream ||
        value instanceof BinaryCoStream
    );
}
