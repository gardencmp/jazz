import { CoID, ContentType } from './contentType.js';

export type JsonAtom = string | number | boolean | null;
export type JsonValue = JsonAtom | JsonArray | JsonObject | CoID<ContentType>;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue; };
