import { RawCoID } from "./ids.js";

export type JsonAtom = string | number | boolean | null;
export type JsonValue = JsonAtom | JsonArray | JsonObject | RawCoID;
export type JsonArray = JsonValue[] | readonly JsonValue[];
export type JsonObject = { [key: string]: JsonValue | undefined };

export type CoJsonValue<T = unknown> = JsonAtom | CoJsonArray<T> | RawCoID | CoJsonObjectWithIndex<T>;
export type CoJsonArray<T = unknown> = CoJsonValue<T>[] | readonly CoJsonValue<T>[];
export type CoJsonObjectWithIndex<T = unknown> = { [K in keyof T]: JsonValue | undefined };
