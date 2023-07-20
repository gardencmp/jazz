import { CoValueID, CoValue } from "./coValue";

export type JsonAtom = string | number | boolean | null;
export type JsonValue = JsonAtom | JsonArray | JsonObject | CoValueID<CoValue>;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue; };
