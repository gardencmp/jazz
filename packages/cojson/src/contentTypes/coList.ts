import { JsonObject, JsonValue } from '../jsonValue.js';
import { CoID } from '../contentType.js';
import { CoValue } from '../coValue.js';

export class CoList<T extends JsonValue, Meta extends JsonObject | null = null> {
    id: CoID<CoList<T, Meta>>;
    type = "colist" as const;
    coValue: CoValue;

    constructor(coValue: CoValue) {
        this.id = coValue.id as CoID<CoList<T, Meta>>;
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
