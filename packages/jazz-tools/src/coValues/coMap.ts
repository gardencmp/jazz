import type { JsonValue, RawCoMap } from "cojson";
import type { Simplify } from "effect/Types";
import { encodeSync, decodeSync } from "@effect/schema/Schema";
import type {
    CoValue,
    Schema,
    Group,
    ID,
    RefEncoded,
    IfCo,
    RefIfCoValue,
} from "../internal.js";
import {
    Account,
    CoValueBase,
    Ref,
    SchemaInit,
    inspect,
    makeRefs,
    subscriptionsScopes,
    ItemsSym,
    InitValues,
    isRefEncoded,
} from "../internal.js";

type DefaultFields = {
    [key: string]: any;
    [ItemsSym]?: any;
};

type CoMapEdit<V> = {
    value?: V;
    ref?: RefIfCoValue<V>;
    by?: Account;
    madeAt: Date;
};

type InitValuesFor<C extends CoMap> = {
    init: Simplify<CoMapInit<C>>;
    owner: Account | Group;
};

export class CoMap<Fields extends object = DefaultFields>
    extends CoValueBase
    implements CoValue<"CoMap", RawCoMap>
{
    declare id: ID<this>;
    declare _type: "CoMap";
    static {
        this.prototype._type = "CoMap";
    }
    declare _raw: RawCoMap;

    static _schema: any;
    get _schema() {
        return (this.constructor as typeof CoMap)._schema as {
            [key: string]: Schema;
        } & { [ItemsSym]?: Schema };
    }

    get _refs(): {
        [Key in CoKeys<this>]: IfCo<this[Key], RefIfCoValue<this[Key]>>;
    } {
        return makeRefs<CoKeys<this>>(
            (key) => this._raw.get(key as string) as unknown as ID<CoValue>,
            () => {
                const keys = Object.keys(this._schema).filter((key) => {
                    const schema = this._schema[
                        key as keyof typeof this._schema
                    ] as Schema;
                    return schema !== "json" && isRefEncoded(schema);
                }) as CoKeys<this>[];

                if (ItemsSym in this._schema) {
                    for (const key of this._raw.keys()) {
                        if (!keys.includes(key as CoKeys<this>)) {
                            keys.push(key as CoKeys<this>);
                        }
                    }
                }

                return keys;
            },
            this._loadedAs,
            (key) =>
                (this._schema[key] ||
                    this._schema[ItemsSym]) as RefEncoded<CoValue>
        ) as any;
    }

    get _edits() {
        return new Proxy(this, {
            get(target, key) {
                const rawEdit = target._raw.lastEditAt(key as string);
                if (!rawEdit) return undefined;

                const descriptor = target._schema[
                    key as keyof typeof target._schema
                ] as Schema;

                return {
                    value:
                        descriptor === "json"
                            ? rawEdit.value
                            : "encoded" in descriptor
                              ? decodeSync(descriptor.encoded)(rawEdit.value)
                              : new Ref(
                                    rawEdit.value as ID<CoValue>,
                                    target._loadedAs,
                                    descriptor
                                ).accessFrom(target),
                    ref:
                        descriptor !== "json" && isRefEncoded(descriptor)
                            ? new Ref(
                                  rawEdit.value as ID<CoValue>,
                                  target._loadedAs,
                                  descriptor
                              )
                            : undefined,
                    by:
                        rawEdit.by &&
                        new Ref(
                            rawEdit.by as ID<Account>,
                            target._loadedAs,
                            Account
                        ).accessFrom(target),
                    madeAt: rawEdit.at,
                };
            },
        }) as {
            [Key in CoKeys<this>]: IfCo<this[Key], CoMapEdit<this[Key]>>;
        };
    }

    get _loadedAs() {
        return Account.fromNode(this._raw.core.node);
    }

    [InitValues]?: any;

    constructor(_init: undefined, options: { fromRaw: RawCoMap });
    constructor(
        init: Simplify<CoMapInit<Fields>>,
        options: { owner: Account | Group }
    );
    constructor(
        init: Simplify<CoMapInit<Fields>> | undefined,
        options: { owner: Account | Group } | { fromRaw: RawCoMap }
    ) {
        super();

        if (init && "owner" in options) {
            this[InitValues] = {
                init,
                owner: options.owner,
            } as InitValuesFor<this>;
        } else if ("fromRaw" in options) {
            Object.defineProperties(this, {
                id: {
                    value: options.fromRaw.id as unknown as ID<this>,
                    enumerable: false,
                },
                _raw: { value: options.fromRaw, enumerable: false },
            });
        } else {
            throw new Error("Invalid CoMap constructor arguments");
        }

        return new Proxy(this, CoMapProxyHandler as ProxyHandler<this>);
    }

    toJSON() {
        const jsonedFields = this._raw.keys().map((key) => {
            const tKey = key as CoKeys<this>;
            const descriptor = this._schema[tKey] as Schema;

            if (descriptor == "json" || "encode" in descriptor) {
                return [key, this._raw.get(key)];
            } else if (isRefEncoded(descriptor)) {
                const jsonedRef = (this as any)[tKey]?.toJSON();
                return [key, jsonedRef];
            } else {
                return [key, undefined];
            }
        });

        return {
            id: this.id,
            _type: this._type,
            ...Object.fromEntries(jsonedFields),
        };
    }

    [inspect]() {
        return this.toJSON();
    }

    rawFromInit<Fields extends object = Record<string, any>>(
        init: Simplify<CoMapInit<Fields>> | undefined,
        owner: Account | Group
    ) {
        const rawOwner = owner._raw;

        const rawInit = {} as {
            [key in keyof Fields]: JsonValue | undefined;
        };

        if (init)
            for (const key of Object.keys(init) as (keyof Fields)[]) {
                const initValue = init[key as keyof typeof init];

                const descriptor = (this._schema[
                    key as keyof typeof this._schema
                ] || this._schema[ItemsSym]) as Schema;

                if (descriptor === "json") {
                    rawInit[key] = initValue as JsonValue;
                } else if (isRefEncoded(descriptor)) {
                    if (initValue) {
                        rawInit[key] = (initValue as unknown as CoValue).id;
                    }
                } else if ("encoded" in descriptor) {
                    rawInit[key] = encodeSync(descriptor.encoded)(
                        initValue as any
                    );
                }
            }

        return rawOwner.createMap(rawInit);
    }

    static Record<Value>(value: IfCo<Value, Value>) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
        class RecordLikeCoMap extends CoMap<RecordLikeCoMap> {
            [ItemsSym] = value;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
        interface RecordLikeCoMap extends Record<string, Value> {}

        return RecordLikeCoMap;
    }
}

export type CoKeys<Fields extends object> = Exclude<
    keyof Fields & string,
    keyof CoMap<Record<string, never>>
>;

export type CoMapInit<Fields extends object> = {
    [Key in CoKeys<Fields> as undefined extends Fields[Key]
        ? never
        : null extends Fields[Key]
          ? never
          : IfCo<Fields[Key], Key>]: Fields[Key];
} & { [Key in CoKeys<Fields> as IfCo<Fields[Key], Key>]?: Fields[Key] };

function tryInit(map: CoMap) {
    if (
        map[InitValues] &&
        (map._schema[ItemsSym] ||
            Object.keys(map[InitValues].init).every(
                (key) => (map._schema as any)[key]
            ))
    ) {
        const raw = map.rawFromInit(
            map[InitValues].init,
            map[InitValues].owner
        );
        Object.defineProperties(map, {
            id: {
                value: raw.id,
                enumerable: false,
            },
            _raw: { value: raw, enumerable: false },
        });
        delete map[InitValues];
    }
}

// TODO: cache handlers per descriptor for performance?
const CoMapProxyHandler: ProxyHandler<CoMap> = {
    get(target, key, receiver) {
        if (key === "_schema") {
            return Reflect.get(target, key);
        } else if (key in target) {
            return Reflect.get(target, key, receiver);
        } else {
            const descriptor = (target._schema[key as keyof CoMap["_schema"]] ||
                target._schema[ItemsSym]) as Schema;
            if (descriptor && typeof key === "string") {
                const raw = target._raw.get(key);

                if (descriptor === "json") {
                    return raw;
                } else if ("encoded" in descriptor) {
                    return raw === undefined
                        ? undefined
                        : decodeSync(descriptor.encoded)(raw);
                } else if (isRefEncoded(descriptor)) {
                    return raw === undefined
                        ? undefined
                        : new Ref(
                              raw as unknown as ID<CoValue>,
                              target._loadedAs,
                              descriptor
                          ).accessFrom(receiver);
                }
            } else {
                return undefined;
            }
        }
    },
    set(target, key, value, receiver) {
        if (
            (typeof key === "string" || ItemsSym) &&
            typeof value === "object" &&
            SchemaInit in value
        ) {
            (target.constructor as typeof CoMap)._schema ||= {};
            (target.constructor as typeof CoMap)._schema[key] =
                value[SchemaInit];
            tryInit(target);
            return true;
        }

        const descriptor = (target._schema[key as keyof CoMap["_schema"]] ||
            target._schema[ItemsSym]) as Schema;
        if (descriptor && typeof key === "string") {
            if (descriptor === "json") {
                target._raw.set(key, value);
            } else if ("encoded" in descriptor) {
                target._raw.set(key, encodeSync(descriptor.encoded)(value));
            } else if (isRefEncoded(descriptor)) {
                target._raw.set(key, value.id);
                subscriptionsScopes.get(target)?.onRefAccessedOrSet(value.id);
            }
            return true;
        } else {
            return Reflect.set(target, key, value, receiver);
        }
    },
    defineProperty(target, key, attributes) {
        if (
            "value" in attributes &&
            typeof attributes.value === "object" &&
            SchemaInit in attributes.value
        ) {
            (target.constructor as typeof CoMap)._schema ||= {};
            (target.constructor as typeof CoMap)._schema[key as string] =
                attributes.value[SchemaInit];
            tryInit(target);
            return true;
        } else {
            return Reflect.defineProperty(target, key, attributes);
        }
    },
    ownKeys(target) {
        const keys = Reflect.ownKeys(target).filter((k) => k !== ItemsSym);
        for (const key of Reflect.ownKeys(target._schema)) {
            if (key !== ItemsSym && !keys.includes(key)) {
                keys.push(key);
            }
        }
        for (const key of target._raw.keys()) {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }

        return keys;
    },
    getOwnPropertyDescriptor(target, key) {
        if (key in target) {
            return Reflect.getOwnPropertyDescriptor(target, key);
        } else {
            const descriptor = (target._schema[key as keyof CoMap["_schema"]] ||
                target._schema[ItemsSym]) as Schema;
            if (descriptor || key in target._raw.ops) {
                return {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                };
            }
        }
    },
};
