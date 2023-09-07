import { JsonObject, JsonValue } from '../jsonValue.js';
import { CoID, ReadableCoValue } from '../coValue.js';
import { CoValueCore } from '../coValueCore.js';
import { Group } from '../index.js';

export class CoStream<T extends JsonValue, Meta extends JsonObject | null = null> implements ReadableCoValue {
    id: CoID<CoStream<T, Meta>>;
    type = "costream" as const;
    core: CoValueCore;

    constructor(core: CoValueCore) {
        this.id = core.id as CoID<CoStream<T, Meta>>;
        this.core = core;
    }

    get meta(): Meta {
        return this.core.header.meta as Meta;
    }

    get group(): Group {
        return this.core.getGroup();
    }

    toJSON(): JsonObject {
        throw new Error("Method not implemented.");
    }

    subscribe(listener: (coMap: CoStream<T, Meta>) => void): () => void {
        return this.core.subscribe((content) => {
            listener(content as CoStream<T, Meta>);
        });
    }
}
