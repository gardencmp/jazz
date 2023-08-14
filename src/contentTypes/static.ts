import { JsonObject } from '../jsonValue.js';
import { CoID } from '../contentType.js';
import { CoValue } from '../coValue.js';

export class Static<T extends JsonObject> {
    id: CoID<Static<T>>;
    type = "static" as const;
    coValue: CoValue;

    constructor(coValue: CoValue) {
        this.id = coValue.id as CoID<Static<T>>;
        this.coValue = coValue;
    }

    toJSON(): JsonObject {
        throw new Error("Method not implemented.");
    }

    subscribe(_listener: (coMap: Static<T>) => void): () => void {
        throw new Error("Method not implemented.");
    }
}
