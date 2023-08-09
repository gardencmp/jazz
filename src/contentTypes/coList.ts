import { JsonObject, JsonValue } from "../jsonValue";
import { CoValueID } from "../contentType";
import { CoValue } from "../coValue";

export class CoList<T extends JsonValue, Meta extends JsonValue> {
    id: CoValueID<CoList<T, Meta>>;
    type: "colist" = "colist";
    coValue: CoValue;

    constructor(coValue: CoValue) {
        this.id = coValue.id as CoValueID<CoList<T, Meta>>;
        this.coValue = coValue;
    }

    toJSON(): JsonObject {
        throw new Error("Method not implemented.");
    }

    subscribe(listener: (coMap: CoList<T, Meta>) => void): () => void {
        return this.coValue.subscribe((content) => {
            listener(content as CoList<T, Meta>);
        });
    }
}
