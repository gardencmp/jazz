import { Deferred, Effect, Option } from "effect";
import { CoValue, ID } from "./coValueInterfaces.js";

type UnavailableError = "unavailable";

export class ValueRef<V extends CoValue> {
    id: ID<V>;
    as: ControlledAccount;
    deferred: Deferred.Deferred<V, UnavailableError>;

    get value() {
        return Effect.runSync(
            Option.getOrElse(Effect.runSync(Deferred.poll(this.deferred)), () =>
                Effect.succeed(undefined)
            )
        );
    }

    get loaded() {
        return Effect.runSync(Deferred.isDone(this.deferred));
    }

    constructor(id: ID<V>, as: ControlledAccount) {
        this.id = id;
        this.as = as;
        this.deferred = (() => {
            throw new Error("Not implemented");
        })();
    }
}

export function makeRefs<F extends { [key: string | number]: ValueRef<CoValue> }>(
    getIdForKey: <K extends keyof F>(key: K) => F[K]['id'] | undefined,
    getKeysWithIds: () => (keyof F)[]
): F {
    const refs = {} as F;
    return new Proxy(refs, {
        get(target, key) {
            throw new Error("Not implemented");
        },
        ownKeys() {
            return getKeysWithIds().map((key) => key.toString());
        },
    });
}
