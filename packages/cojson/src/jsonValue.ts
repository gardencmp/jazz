import { RawCoID } from "./ids.js";

export type JsonAtom = string | number | boolean | null;
export type JsonValue = JsonAtom | JsonArray | JsonObject | RawCoID;
export type JsonArray = JsonValue[] | readonly JsonValue[];
export type JsonObject = { [key: string]: JsonValue | undefined };

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
    U[keyof U];
type ExcludeEmpty<T> = T extends AtLeastOne<T> ? T : never;

export type CoJsonValue<T> =
    | JsonValue
    | CoJsonObjectWithIndex<T>
    | CoJsonArray<T>;
export type CoJsonArray<T> = CoJsonValue<T>[] | readonly CoJsonValue<T>[];

/**
 * Since we are forcing Typescript to elaborate the indexes from the given type passing
 * non-object values to CoJsonObjectWithIndex will return an empty object
 * E.g.
 *   CoJsonObjectWithIndex<() => void> --> {}
 *   CoJsonObjectWithIndex<RegExp> --> {}
 *
 * Applying the ExcludeEmpty type here to make sure we don't accept functions or non-serializable values
 */
export type CoJsonObjectWithIndex<T> = ExcludeEmpty<{
    [K in keyof T & string]: CoJsonValue1L<T[K]> | undefined;
}>;

/**
 * Manually handling the nested interface types to not get into infinite recursion issues.
 */
export type CoJsonValue1L<T> =
    | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue2L<T[K]> | undefined }>
    | JsonValue;
export type CoJsonValue2L<T> =
    | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue3L<T[K]> | undefined }>
    | JsonValue;
export type CoJsonValue3L<T> =
    | ExcludeEmpty<{ [K in keyof T & string]: CoJsonValue4L<T[K]> | undefined }>
    | JsonValue;
export type CoJsonValue4L<T> =
    | ExcludeEmpty<{ [K in keyof T & string]: JsonValue | undefined }>
    | JsonValue;
