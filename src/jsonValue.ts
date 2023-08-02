import { CoValueID, CoValueContent } from "./coValue";

export type JsonAtom = string | number | boolean | null;
export type JsonValue = JsonAtom | JsonArray | JsonObject | CoValueID<CoValueContent>;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue; };
