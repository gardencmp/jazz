import { JsonObject, JsonValue } from "./jsonValue.js";
import { RawCoID } from "./ids.js";
import { CoMap } from "./coValues/coMap.js";
import {
    BinaryCoStream,
    BinaryCoStreamMeta,
    CoStream,
} from "./coValues/coStream.js";
import { Static } from "./coValues/static.js";
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
    /** Lets you subscribe to future updates to this CoValue (whether made locally or by other users).
     *
     * Takes a listener function that will be called with the current state for each update.
     *
     * Returns an unsubscribe function.
     *
     * Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`. */
    subscribe(listener: (coValue: this) => void): () => void;
    /** Lets you apply edits to a `CoValue`, inside the changer callback, which receives a `WriteableCoValue`.
     *
     *  A `WritableCoValue` has all the same methods as a `CoValue`, but all edits made to it (with its additional mutator methods)
     *  are reflected in it immediately - so it behaves mutably, whereas a `CoValue` is always immutable
     *  (you need to use `subscribe` to receive new versions of it). */
    edit?: ((changer: (editable: CoValue) => void) => this) | undefined;
}

export type AnyCoMap = CoMap<
    { [key: string]: JsonValue | CoValue | undefined },
    JsonObject | null
>;

export type AnyCoList = CoList<JsonValue | CoValue, JsonObject | null>;

export type AnyCoStream = CoStream<JsonValue | CoValue, JsonObject | null>;

export type AnyBinaryCoStream = BinaryCoStream<BinaryCoStreamMeta>;

export type AnyStatic = Static<JsonObject>;

export type AnyCoValue =
    | AnyCoMap
    | AnyCoList
    | AnyCoStream
    | AnyBinaryCoStream
    | AnyStatic;

export function expectMap(
    content: CoValue
): CoMap<{ [key: string]: string }, JsonObject | null> {
    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    return content as CoMap<{ [key: string]: string }, JsonObject | null>;
}

export function isCoValueImpl(
    value: JsonValue | AnyCoValue | undefined
): value is AnyCoValue {
    return (
        value instanceof CoMap ||
        value instanceof CoList ||
        value instanceof CoStream ||
        value instanceof BinaryCoStream ||
        value instanceof Static
    );
}

export function isCoValue(value: JsonValue | CoValue | undefined) : value is CoValue {
    return isCoValueImpl(value as AnyCoValue);
}
