import type { JsonValue, RawCoMap } from "cojson";
import type { Simplify } from "effect/Types";
import { Schema } from "@effect/schema";
import type {
    CoValue,
    Encoder,
    FieldDescriptor,
    FieldDescriptorFor,
    Group,
    ID,
    RefField,
    EnsureCoValueNullable,
    CoValueClass,
} from "../internal.js";
import {
    Account,
    CoValueBase,
    ValueRef,
    inspect,
    makeRefs,
    subscriptionsScopes,
    indexSignature,
} from "../internal.js";

type EnsureValid<
    Fields extends { [key: string]: any; [indexSignature]?: any },
> = {
    [Key in OwnKeys<Fields> as IfOptionalKey<
        Key,
        Fields
    >]?: EnsureCoValueNullable<Fields[Key], Key>;
} & {
    [Key in OwnKeys<Fields> as IfRequiredKey<
        Key,
        Fields
    >]: EnsureCoValueNullable<Fields[Key], Key>;
} & {
    [Key in indexSignature]?: EnsureCoValueNullable<
        Fields[indexSignature],
        Key
    >;
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
    [indexSignature]?: any;
};

export class CoMap<Fields extends EnsureValid<Fields> = DefaultFields>
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
        [Key in OwnKeys<Fields>]: FieldDescriptorFor<Fields[Key]>;
    } & {
        [indexSignature]: indexSignature extends keyof Fields
            ? FieldDescriptorFor<Fields[indexSignature]>
            : never;
    } {
        return (this.constructor as typeof CoMap)._encoding;
    }

    get _refs(): {
        [Key in OwnKeys<Fields> as NonNullable<Fields[Key]> extends CoValue
            ? Key
            : never]: NonNullable<Fields[Key]> extends CoValue
            ? ValueRef<NonNullable<Fields[Key]>>
            : never;
    } {
        return makeRefs<OwnKeys<Fields>>(
            (key) => this._raw.get(key as string) as unknown as ID<CoValue>,
            () =>
                Object.keys(this._encoding).filter((key) => {
                    const schema = this._encoding[
                        key as keyof typeof this._encoding
                    ] as FieldDescriptor;
                    schema !== "json" && "ref" in schema;
                }) as OwnKeys<Fields>[],
            this._loadedAs,
            (key) => (this._encoding[key] as RefField<CoValue>).ref()
        ) as any;
    }

    get _edits(): {
        [Key in OwnKeys<Fields>]: {
            value?: Fields[Key];
            ref?: Fields[Key] extends CoValue ? ValueRef<Fields[Key]> : never;
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
                ] as FieldDescriptor;

                return {
                    value:
                        descriptor === "json"
                            ? rawEdit.value
                            : "encoded" in descriptor
                              ? Schema.decodeSync(descriptor.encoded)(
                                    rawEdit.value
                                )
                              : new ValueRef(
                                    rawEdit.value as ID<CoValue>,
                                    target._loadedAs,
                                    descriptor.ref()
                                ).accessFrom(target),
                    ref:
                        descriptor !== "json" && "ref" in descriptor
                            ? new ValueRef(
                                  rawEdit.value as ID<CoValue>,
                                  target._loadedAs,
                                  descriptor.ref()
                              )
                            : undefined,
                    by:
                        rawEdit.by &&
                        new ValueRef(
                            rawEdit.by as ID<Account>,
                            target._loadedAs,
                            Account
                        ).accessFrom(target),
                    madeAt: rawEdit.at,
                };
            },
        }) as any;
    }

    get _loadedAs() {
        return Account.fromNode(this._raw.core.node);
    }

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

        if (!this._encoding) {
            throw new Error(
                "No schema found in " +
                    this.constructor.name +
                    " - ensure that you have a `static { this.define({...}) }` block in the class definition."
            );
        }

        const raw: RawCoMap = this.rawFromInit<Fields>(options, init);

        Object.defineProperties(this, {
            id: {
                value: raw.id,
                enumerable: false,
            },
            _raw: { value: raw, enumerable: false },
        });

        this.definePropertiesFromSchema();

        if (this._encoding[indexSignature]) {
            return new Proxy(this, CoMapProxyHandler<Fields>());
        }
    }

    toJSON() {
        const jsonedFields = this._raw.keys().map((key) => {
            const tKey = key as OwnKeys<Fields>;
            const descriptor = this._encoding[tKey] as FieldDescriptor;

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
        options: { owner: Account | Group } | { fromRaw: RawCoMap },
        init: Simplify<CoMapInit<Fields>> | undefined
    ) {
        let raw: RawCoMap;

        if ("fromRaw" in options) {
            raw = options.fromRaw;
        } else {
            const rawOwner = options.owner._raw;

            const rawInit = {} as {
                [key in keyof Fields]: JsonValue | undefined;
            };

            if (init)
                for (const key of Object.keys(init) as (keyof Fields)[]) {
                    const initValue = init[key as keyof typeof init];

                    const descriptor = (this._encoding[
                        key as keyof typeof this._encoding
                    ] || this._encoding[indexSignature]) as FieldDescriptor;

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

            raw = rawOwner.createMap(rawInit);
        }
        return raw;
    }

    static encoding<V extends CoMap>(
        this: { new (...args: any): V } & typeof CoMap,
        fields: Simplify<{
            [Key in keyof V["_encoding"] as V["_encoding"][Key] extends never
                ? never
                : Key]: Simplify<V["_encoding"][Key]>;
        }>
    ) {
        this._encoding ||= {};
        Object.assign(this._encoding, fields);
    }

    private definePropertiesFromSchema() {
        for (const [key, fieldSchema] of Object.entries(this._encoding)) {
            if (key === "indexSignature") continue;
            const descriptor = fieldSchema as FieldDescriptor;
            if (descriptor === "json") {
                Object.defineProperty(
                    this,
                    key,
                    this.primitivePropDef(key as string)
                );
            } else if ("encoded" in descriptor) {
                Object.defineProperty(
                    this,
                    key,
                    this.encodedPropDef(key as string, descriptor.encoded)
                );
            } else if ("ref" in descriptor) {
                Object.defineProperty(
                    this,
                    key,
                    this.refPropDef(
                        key as string,
                        (descriptor as RefField<CoValue>).ref
                    )
                );
            }
        }
    }

    private primitivePropDef(key: string): PropertyDescriptor {
        return {
            get: () => {
                return this._raw.get(key);
            },
            set(this: CoMap, value: JsonValue) {
                this._raw.set(key, value);
            },
            enumerable: true,
            configurable: true,
        };
    }

    private encodedPropDef(key: string, arg: Encoder<any>): PropertyDescriptor {
        return {
            get: () => {
                const raw = this._raw.get(key);
                return raw === undefined
                    ? undefined
                    : Schema.decodeSync(arg)(raw);
            },
            set(this: CoMap, value: unknown) {
                this._raw.set(key, Schema.encodeSync(arg)(value));
            },
            enumerable: true,
            configurable: true,
        };
    }

    private refPropDef(
        key: string,
        ref: () => CoValueClass<CoValue>
    ): PropertyDescriptor {
        return {
            get: () => {
                const rawID = this._raw.get(key);
                return rawID === undefined
                    ? undefined
                    : new ValueRef(
                          rawID as unknown as ID<CoValue>,
                          this._loadedAs,
                          ref()
                      ).accessFrom(this);
            },
            set: (value: CoValue) => {
                this._raw.set(key, value.id);
                subscriptionsScopes.get(this)?.onRefAccessedOrSet(value.id);
            },
            enumerable: true,
            configurable: true,
        };
    }
}

export type OwnKeys<Fields extends object> = Exclude<
    keyof Fields & string,
    keyof CoMap<Record<string, never>> | `_${string}`
>;

export type CoMapInit<Fields extends object> = {
    [Key in OwnKeys<Fields> as undefined extends Fields[Key]
        ? never
        : null extends Fields[Key]
          ? never
          : Key]: Fields[Key];
} & { [Key in OwnKeys<Fields>]?: Fields[Key] };

// TODO: cache handlers per descriptor for performance?
function CoMapProxyHandler<Fields extends EnsureValid<Fields>>(): ProxyHandler<
    CoMap<Fields>
> {
    return {
        get(target, key, receiver) {
            const descriptor = target._encoding[
                indexSignature
            ] as FieldDescriptor;
            if (key in target || typeof key === "symbol") {
                return Reflect.get(target, key, receiver);
            } else {
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
                        : new ValueRef(
                              raw as unknown as ID<CoValue>,
                              target._loadedAs,
                              descriptor.ref()
                          ).accessFrom(target);
                }
            }
        },
        set(target, key, value, receiver) {
            const descriptor = target._encoding[
                indexSignature
            ] as FieldDescriptor;
            if (key in target || typeof key === "symbol") {
                return Reflect.set(target, key, value, receiver);
            } else {
                if (descriptor === "json") {
                    target._raw.set(key, value);
                } else if ("encoded" in descriptor) {
                    target._raw.set(
                        key,
                        Schema.encodeSync(descriptor.encoded)(value)
                    );
                } else if ("ref" in descriptor) {
                    target._raw.set(key, value.id);
                    subscriptionsScopes
                        .get(target)
                        ?.onRefAccessedOrSet(value.id);
                }
                return true;
            }
        },
        ownKeys(target) {
            const keys = Reflect.ownKeys(target);
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
            } else if (key in target._raw.ops) {
                return {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                };
            }
        },
    };
}
