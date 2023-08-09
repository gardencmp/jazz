import { JsonObject, JsonValue } from "../jsonValue";
import { CoValueID } from "../contentType";
import { CoValue } from "../coValue";

export class CoStream<T extends JsonValue, Meta extends JsonValue> {
    id: CoValueID<CoStream<T, Meta>>;
    type: "costream" = "costream";
    coValue: CoValue;

    constructor(coValue: CoValue) {
        this.id = coValue.id as CoValueID<CoStream<T, Meta>>;
        this.coValue = coValue;
    }

    toJSON(): JsonObject {
        throw new Error("Method not implemented.");
    }

    subscribe(listener: (coMap: CoStream<T, Meta>) => void): () => void {
        return this.coValue.subscribe((content) => {
            listener(content as CoStream<T, Meta>);
        });
    }
}
