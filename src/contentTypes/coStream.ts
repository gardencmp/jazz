import { JsonObject, JsonValue } from '../jsonValue.js';
import { CoValueID } from '../contentType.js';
import { CoValue } from '../coValue.js';

export class CoStream<T extends JsonValue, Meta extends JsonValue> {
    id: CoValueID<CoStream<T, Meta>>;
    type = "costream" as const;
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
