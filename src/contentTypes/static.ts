import { JsonObject, JsonValue } from "../jsonValue";
import { CoValueID } from "../contentType";
import { CoValue } from "../coValue";

export class Static<T extends JsonValue> {
    id: CoValueID<Static<T>>;
    type: "static" = "static";
    coValue: CoValue;

    constructor(coValue: CoValue) {
        this.id = coValue.id as CoValueID<Static<T>>;
        this.coValue = coValue;
    }

    toJSON(): JsonObject {
        throw new Error("Method not implemented.");
    }

    subscribe(listener: (coMap: Static<T>) => void): () => void {
        throw new Error("Method not implemented.");
    }
}
