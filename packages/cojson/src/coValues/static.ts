import { JsonObject } from '../jsonValue.js';
import { CoID, CoValue } from '../coValue.js';
import { CoValueCore } from '../coValueCore.js';
import { Group } from '../index.js';

export class Static<T extends JsonObject> implements CoValue{
    id: CoID<this>;
    type = "static" as const;
    core: CoValueCore;

    constructor(core: CoValueCore) {
        this.id = core.id as CoID<this>;
        this.core = core;
    }

    get meta(): T {
        return this.core.header.meta as T;
    }

    get group(): Group {
        return this.core.getGroup();
    }

    toJSON(): JsonObject {
        throw new Error("Method not implemented.");
    }

    subscribe(_listener: (st: this) => void): () => void {
        throw new Error("Method not implemented.");
    }
}
