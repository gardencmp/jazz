import type { JsonValue, RawCoMap } from "cojson";
import type { Simplify } from "effect/Types";
import { Schema } from "@effect/schema";
import type {
    CoValue,
    Encoding,
    EncodingFor,
    Group,
    ID,
    RefEncoded,
    EnsureCoValueNullable,
    IsVal,
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
} from "../internal.js";

type ValidFields<Fields extends { [key: string]: any; [ItemsSym]?: any }> = {
    [Key in keyof Fields & string as IsVal<
        Fields[Key],
        IfOptionalKey<Key, Fields>
    >]?: EnsureCoValueNullable<Fields[Key], Key>;
} & {
    [Key in keyof Fields & string as IsVal<
        Fields[Key],
        IfRequiredKey<Key, Fields>
    >]: EnsureCoValueNullable<Fields[Key], Key>;
} & {
    [Key in ItemsSym]?: EnsureCoValueNullable<Fields[ItemsSym], Key>;
};

type IfOptionalKey<Key extends keyof Obj, Obj> = Pick<
    Partial<Obj>,
    Key
> extends Pick<Obj, Key>
    ? Key
    : never;
type IfRequiredKey<Key extends keyof Obj, Obj> = Pick<
    Partial<Obj>,
    Key
> extends Pick<Obj, Key>
    ? never
    : Key;

type DefaultFields = {
    [key: string]: any;
    [ItemsSym]?: any;
};

export class CoMap<Fields extends ValidFields<Fields> = DefaultFields>
    extends CoValueBase
    implements CoValue<"CoMap", RawCoMap>
{
    id!: ID<this>;
    _type!: "CoMap";
    static {
        this.prototype._type = "CoMap";
    }
    _raw!: RawCoMap;

    static _encoding: any;
    get _encoding(): {
        [Key in OwnKeys<Fields> as IsVal<Fields[Key], Key>]: EncodingFor<
            Fields[Key]
        >;
    } & {
        [ItemsSym]: ItemsSym extends keyof Fields
            ? EncodingFor<Fields[ItemsSym]>
            : never;
    } {
        return (this.constructor as typeof CoMap)._encoding;
    }

    get _refs(): {
        [Key in OwnKeys<Fields> as NonNullable<Fields[Key]> extends CoValue
            ? Key
            : never]: NonNullable<Fields[Key]> extends CoValue
            ? Ref<NonNullable<Fields[Key]>>
            : never;
    } {
        return makeRefs<OwnKeys<Fields>>(
            (key) => this._raw.get(key as string) as unknown as ID<CoValue>,
            () =>
                Object.keys(this._encoding).filter((key) => {
                    const schema = this._encoding[
                        key as keyof typeof this._encoding
                    ] as Encoding;
                    schema !== "json" && "ref" in schema;
                }) as OwnKeys<Fields>[],
            this._loadedAs,
            (key) => this._encoding[key] as RefEncoded<CoValue>
        ) as any;
    }

    get _edits(): {
        [Key in OwnKeys<Fields> as IsVal<Fields[Key], Key>]: {
            value?: Fields[Key];
            ref?: Fields[Key] extends CoValue ? Ref<Fields[Key]> : never;
            by?: Account;
            madeAt: Date;
        };
    } {
        return new Proxy(this, {
            get(target, key) {
                const rawEdit = target._raw.lastEditAt(key as string);
                if (!rawEdit) return undefined;

                const descriptor = target._encoding[
                    key as keyof typeof target._encoding
                ] as Encoding;

                return {
                    value:
                        descriptor === "json"
                            ? rawEdit.value
                            : "encoded" in descriptor
                              ? Schema.decodeSync(descriptor.encoded)(
                                    rawEdit.value
                                )
                              : new Ref(
                                    rawEdit.value as ID<CoValue>,
                                    target._loadedAs,
                                    descriptor
                                ).accessFrom(target),
                    ref:
                        descriptor !== "json" && "ref" in descriptor
                            ? new Ref(
                                  rawEdit.value as ID<CoValue>,
                                  target._loadedAs,
                                  descriptor
                              )
                            : undefined,
                    by:
                        rawEdit.by &&
                        new Ref(rawEdit.by as ID<Account>, target._loadedAs, {
                            ref: () => Account,
                        }).accessFrom(target),
                    madeAt: rawEdit.at,
                };
            },
        }) as any;
    }

    get _loadedAs() {
        return Account.fromNode(this._raw.core.node);
    }

    [InitValues]?: {
        init: Simplify<CoMapInit<Fields>>;
        owner: Account | Group;
    };

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
            this[InitValues] = { init, owner: options.owner };
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
            const tKey = key as OwnKeys<Fields>;
            const descriptor = this._encoding[tKey] as Encoding;

            if (descriptor == "json" || "encode" in descriptor) {
                return [key, this._raw.get(key)];
            } else if ("ref" in descriptor) {
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

                const descriptor = (this._encoding[
                    key as keyof typeof this._encoding
                ] || this._encoding[ItemsSym]) as Encoding;

                if (descriptor === "json") {
                    rawInit[key] = initValue as JsonValue;
                } else if ("ref" in descriptor) {
                    if (initValue) {
                        rawInit[key] = (initValue as unknown as CoValue).id;
                    }
                } else if ("encoded" in descriptor) {
                    rawInit[key] = Schema.encodeSync(descriptor.encoded)(
                        initValue as any
                    );
                }
            }

        return rawOwner.createMap(rawInit);
    }
}

export type OwnKeys<Fields extends object> = Exclude<
    keyof Fields & string,
    keyof CoMap<Record<string, never>>
>;

export type CoMapInit<Fields extends object> = {
    [Key in OwnKeys<Fields> as undefined extends Fields[Key]
        ? never
        : null extends Fields[Key]
          ? never
          : IsVal<Fields[Key], Key>]: Fields[Key];
} & { [Key in OwnKeys<Fields> as IsVal<Fields[Key], Key>]?: Fields[Key] };

function tryInit(map: CoMap) {
    if (
        map[InitValues] &&
        (map._encoding[ItemsSym] ||
            Object.keys(map[InitValues].init).every(
                (key) => map._encoding[key]
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
        if (key === "_encoding") {
            return Reflect.get(target, key);
        } else if (key in target) {
            return Reflect.get(target, key, receiver);
        } else {
            const descriptor = (target._encoding[
                key as keyof CoMap["_encoding"]
            ] || target._encoding[ItemsSym]) as Encoding;
            if (descriptor && typeof key === "string") {
                const raw = target._raw.get(key);

                if (descriptor === "json") {
                    return raw;
                } else if ("encoded" in descriptor) {
                    return raw === undefined
                        ? undefined
                        : Schema.decodeSync(descriptor.encoded)(raw);
                } else if ("ref" in descriptor) {
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
            (target.constructor as typeof CoMap)._encoding ||= {};
            (target.constructor as typeof CoMap)._encoding[key] =
                value[SchemaInit];
            tryInit(target);
            return true;
        }

        const descriptor = (target._encoding[key as keyof CoMap["_encoding"]] ||
            target._encoding[ItemsSym]) as Encoding;
        if (descriptor && typeof key === "string") {
            if (descriptor === "json") {
                target._raw.set(key, value);
            } else if ("encoded" in descriptor) {
                target._raw.set(
                    key,
                    Schema.encodeSync(descriptor.encoded)(value)
                );
            } else if ("ref" in descriptor) {
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
            (target.constructor as typeof CoMap)._encoding ||= {};
            (target.constructor as typeof CoMap)._encoding[key as string] =
                attributes.value[SchemaInit];
            tryInit(target);
            return true;
        } else {
            return Reflect.defineProperty(target, key, attributes);
        }
    },
    ownKeys(target) {
        const keys = Reflect.ownKeys(target).filter((k) => k !== ItemsSym);
        for (const key of Reflect.ownKeys(target._encoding)) {
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
            const descriptor = (target._encoding[
                key as keyof CoMap["_encoding"]
            ] || target._encoding[ItemsSym]) as Encoding;
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
