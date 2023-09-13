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
import { AccountID } from "./index.js";

export type CoID<T extends CoValueImpl> = RawCoID & {
    readonly __type: T;
};

export interface ReadableCoValue extends CoValue {
    /** Lets you subscribe to future updates to this CoValue (whether made locally or by other users).
     *
     * Takes a listener function that will be called with the current state for each update.
     *
     * Returns an unsubscribe function.
     *
     * Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`. */
    subscribe(listener: (coValue: CoValueImpl) => void): () => void;
    /** Lets you apply edits to a `CoValue`, inside the changer callback, which receives a `WriteableCoValue`.
     *
     *  A `WritableCoValue` has all the same methods as a `CoValue`, but all edits made to it (with its additional mutator methods)
     *  are reflected in it immediately - so it behaves mutably, whereas a `CoValue` is always immutable
     *  (you need to use `subscribe` to receive new versions of it). */
    edit?:
        | ((changer: (editable: WriteableCoValue) => void) => CoValueImpl)
        | undefined;
}

export interface CoValue {
    /** The `CoValue`'s (precisely typed) `CoID` */
    id: CoID<CoValueImpl>;
    core: CoValueCore;
    /** Specifies which kind of `CoValue` this is */
    type: CoValueImpl["type"];
    /** The `CoValue`'s (precisely typed) static metadata */
    meta: JsonObject | null;
    /** The `Group` this `CoValue` belongs to (determining permissions) */
    group: Group;
    /** Returns an immutable JSON presentation of this `CoValue` */
    toJSON(): JsonValue;
}

export interface WriteableCoValue extends CoValue {}

export type CoValueImpl =
    | CoMap<{ [key: string]: JsonValue | CoValueImpl | undefined }, JsonObject | null>
    | CoList<JsonValue| CoValueImpl, JsonObject | null>
    | CoStream<JsonValue, JsonObject | null>
    | BinaryCoStream<BinaryCoStreamMeta>
    | Static<JsonObject>;

export function expectMap(
    content: CoValueImpl
): CoMap<{ [key: string]: string }, JsonObject | null> {
    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    return content as CoMap<{ [key: string]: string }, JsonObject | null>;
}
export const AllReservedQueryProps = [
    "id",
    "type",
    "meta",
    "group",
    "shadowed",
] as const;
export type ReservedQueryProps = (typeof AllReservedQueryProps)[number];

export type FullQueryResult<T extends CoValueImpl> = T extends CoMap<
    infer M,
    infer Meta
>
    ? {
          id: CoID<T>;
          type: "comap";
          meta: Meta;
          group: Group;
          shadowed: {
              [K in keyof M as Extract<K, ReservedQueryProps>]: ResolveIDorJSON<
                  M[K]
              >;
          };
      } & {
          [K in keyof M as Exclude<K, ReservedQueryProps>]: ResolveIDorJSON<
              M[K]
          >;
      }
    : T extends CoList<infer T, infer _>
    ? ResolveIDorJSON<T>[]
    : T extends CoStream<infer T, infer _>
    ? {
          all: { [acc: AccountID]: ResolveIDorJSON<T>[] | undefined };
          last: { [acc: AccountID]: ResolveIDorJSON<T> | undefined };
          only: { [acc: AccountID]: ResolveIDorJSON<T> | undefined };
      }
    : T extends BinaryCoStream<infer _>
    ? {
          all: { [acc: AccountID]: Uint8Array[] | undefined };
          last: { [acc: AccountID]: Uint8Array | undefined };
          only: { [acc: AccountID]: Uint8Array | undefined };
      }
    : T extends Static<infer _>
    ? Record<string, never>
    : never;

export type ResolveIDorJSON<
    V extends JsonValue | CoValueImpl | CoID<CoValueImpl> | undefined
> = V extends CoID<infer C> ? FullQueryResult<C> : V;

export function isCoValueImpl(
    value: JsonValue | CoValueImpl | undefined
): value is CoValueImpl {
    return (
        value instanceof CoMap ||
        value instanceof CoList ||
        value instanceof CoStream ||
        value instanceof BinaryCoStream ||
        value instanceof Static
    );
}