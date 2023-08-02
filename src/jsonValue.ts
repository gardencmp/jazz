import { CoValueID, ContentType } from "./contentType";

export type JsonAtom = string | number | boolean | null;
export type JsonValue = JsonAtom | JsonArray | JsonObject | CoValueID<ContentType>;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue; };
