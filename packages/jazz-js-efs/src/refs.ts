import { Deferred, Effect, Option } from "effect";
import {
    CoValue,
    CoValueSchema,
    ID,
    rawCoValueSym,
} from "./coValueInterfaces.js";
import { ControlledAccount } from "./coValues/account/account.js";
import { CoID, RawCoValue } from "cojson";
import { UnavailableError } from "./errors.js";

export class ValueRef<V extends CoValue> {
    id: ID<V>;
    private controlledAccount: ControlledAccount;
    ValueSchema: {
        new (options: { fromRaw: V[rawCoValueSym] }): V;
    };

    get value() {
        const raw = this.controlledAccount[rawCoValueSym].core.node.getLoaded(
            this.id as unknown as CoID<RawCoValue>
        );
        if (raw) {
            return new this.ValueSchema({ fromRaw: raw })
        }
    }

    loadEf() {
        return Effect.async<V, UnavailableError>((fulfill) => {
            this.load().then((value) => {
                if (value === "unavailable") {
                    fulfill(Effect.fail<UnavailableError>("unavailable"));
                } else {
                    fulfill(Effect.succeed(value));
                }
            }).catch((e) => {
                fulfill(Effect.die(e));
            });
        })
    }

    async load(): Promise<V | "unavailable"> {
        const raw = await this.controlledAccount[rawCoValueSym].core.node.load(this.id as unknown as CoID<RawCoValue>)
        if (raw === "unavailable") {
            return "unavailable";
        } else {
            return new this.ValueSchema({ fromRaw: raw });
        }
    }

    constructor(
        id: ID<V>,
        controlledAccount: ControlledAccount,
        ValueSchema: {
            new (options: { fromRaw: V[rawCoValueSym] }): V;
        }
    ) {
        this.id = id;
        this.controlledAccount = controlledAccount;
        this.ValueSchema = ValueSchema;
    }
}

export function makeRefs<F extends { [key: string | number]: CoValue }>(
    getIdForKey: <K extends keyof F>(key: K) => F[K]["id"] | undefined,
    getKeysWithIds: () => (keyof F)[],
    controlledAccount: ControlledAccount,
    schemaForKey: <K extends keyof F>(
        key: K
    ) => { new (options: { fromRaw: F[K][rawCoValueSym] }): F[K] }
): { [K in keyof F]: ValueRef<F[K]> } {
    const refs = {} as { [K in keyof F]: ValueRef<F[K]> };
    return new Proxy(refs, {
        get(target, key) {
            if (typeof key === "symbol") return undefined;
            const id = getIdForKey(key as keyof F);
            if (!id) return undefined;
            return new ValueRef(
                id as ID<F[typeof key]>,
                controlledAccount,
                schemaForKey(key as keyof F)
            );
        },
        ownKeys() {
            return getKeysWithIds().map((key) => key.toString());
        },
    });
}
