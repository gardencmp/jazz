import { RawCoID } from "./ids.js";

export type JsonAtom = string | number | boolean | null;
export type JsonValue = JsonAtom | JsonArray | JsonObject | RawCoID;
export type JsonArray = JsonValue[] | readonly JsonValue[];
export type JsonObject = { [key: string]: JsonValue | undefined };

type AtLeastOne<T, U = {[K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];
type ExcludeEmpty<T> = T extends AtLeastOne<T> ? T : never; 

export type CoJsonValue<T> = JsonAtom | CoJsonObjectWithIndex<T> | CoJsonArray<T> | RawCoID;
export type CoJsonArray<T> = CoJsonValue<T>[] | readonly CoJsonValue<T>[];

/**
 * Since we are forcing Typescript to elaborate the indexes from the given type passing
 * non-object values to CoJsonObjectWithIndex will return empty o
 * E.g. 
 *   CoJsonObjectWithIndex<() => void> --> {}
 *   CoJsonObjectWithIndex<RegExp> --> {}
 * 
 * Applying the ExcludeEmpty type here to make sure we don't accept functions or non-serializable values
 */
export type CoJsonObjectWithIndex<T> = ExcludeEmpty<{ [K in keyof T & string]: JsonValue | undefined }>;
