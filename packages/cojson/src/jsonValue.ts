import { RawCoID } from "./ids.js";

export type JsonAtom = string | number | boolean | null;
export type JsonValue = JsonAtom | JsonArray | JsonObject | RawCoID;
export type JsonArray = JsonValue[] | readonly JsonValue[];
export type JsonObject = { [key: string]: JsonValue | undefined };
