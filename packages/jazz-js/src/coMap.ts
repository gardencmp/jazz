import { CoID, CoValue as RawCoValue, CoMap as RawCoMap, Account as RawAccount } from "cojson";
import {
    ID,
    CoValue,
    CoValueSchemaBase,
    CoValueSchema,
    RawType,
    CoValueBase,
    SimpleAccount,
} from "./index.js";
import { isCoValueSchema } from "./guards.js";
import { Schema } from "./schema.js";
import { Group } from "./group.js";
import { Account, ControlledAccount } from "./account.js";

// type BaseCoMapShape = { [key: string]: Schema };
type BaseCoMapShape = Record<string, Schema>;

export type CoMap<Shape extends BaseCoMapShape = BaseCoMapShape> = {
    [Key in keyof Shape]: Shape[Key]["_Value"] extends CoValue
        ? Shape[Key]["_Value"] | undefined
        : Shape[Key]["_Value"];
} & {
    id: ID<CoMap<Shape>>;
    meta: CoMapMeta<Shape>;
    subscribe: (listener: (newValue: CoMap<Shape>) => void) => () => void;
} & CoValueBase;

type RawShape<Shape extends BaseCoMapShape> = {
    [Key in keyof Shape]: RawType<Shape[Key]>;
};

export interface CoMapSchema<Shape extends BaseCoMapShape = BaseCoMapShape>
    extends Schema<CoMap<Shape>>,
        CoValueSchemaBase<CoMap<Shape>, RawCoMap<RawShape<Shape>>> {
    _Type: "comap";
    _Shape: Shape;

    new (init: CoMapInit<Shape>, opts: { owner: Account | Group }): CoMap<Shape>;

    fromRaw<Raw extends RawCoMap<RawShape<Shape>>>(
        raw: Raw,
        onGetRef?: (id: ID<CoValue>) => void
    ): CoMap<Shape>;
}

export function isCoMapSchema(value: unknown): value is CoMapSchema {
    return (
        typeof value === "object" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "comap"
    );
}

export function isCoMap(value: unknown): value is CoMap {
    return typeof value === "object" &&
    value !== null && isCoMapSchema(value.constructor) && "id" in value;
}

type CoMapInitBase<Shape extends BaseCoMapShape> = {
    [Key in keyof Shape as null extends Shape[Key]["_Value"]
        ? never
        : Key]?: Shape[Key]["_Value"];
} & {
    [Key in keyof Shape as null extends Shape[Key]["_Value"] ? Key : never]?:
        | Shape[Key]["_Value"]
        | null
        | undefined;
};

export type CoMapInit<Shape extends BaseCoMapShape> = Record<
    string,
    never
> extends CoMapInitBase<Shape>
    ? CoMapInitBase<Shape> | undefined
    : CoMapInitBase<Shape>;

export function CoMapOf<Shape extends BaseCoMapShape>(
    SchemaShape: Shape
): CoMapSchema<Shape> {
    class CoMapSchemaForShape {
        static _Type = "comap" as const;
        static _Shape = SchemaShape;
        static _Value: CoMap<Shape> = "CoMap<Shape>" as unknown as CoMap<Shape>;
        static _RawValue: RawCoMap<RawShape<Shape>>;

        _raw: RawCoMap<RawShape<Shape>>;
        _refs: { [key in keyof Shape]?: Shape[key]["_Value"] };
        _onGetRef?: (id: ID<CoValue>) => void;
        id: ID<CoMap<Shape>>;
        meta: CoMapMeta<Shape>;

        constructor(init: CoMapInit<Shape>, opts: { owner: Account });
        constructor(
            init: undefined,
            options: {
                fromRaw: RawCoMap<RawShape<Shape>>;
                onGetRef?: (id: ID<CoValue>) => void;
            }
        );
        constructor(
            init: CoMapInit<Shape> | undefined,
            options:
                | { owner: Group | Account }
                | {
                      fromRaw: RawCoMap<RawShape<Shape>>;
                      onGetRef?: (id: ID<CoValue>) => void;
                  }
        ) {
            let raw: RawCoMap<RawShape<Shape>>;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
                this._onGetRef = options.onGetRef;
            } else if (init && options.owner) {
                const rawOwner = options.owner._raw;

                const initForInner = {} as RawCoMap<RawShape<Shape>>["_shape"];

                for (const key in init) {
                    const keySchema = SchemaShape[key];

                    if (isCoValueSchema(keySchema)) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        initForInner[key] = (init as any)[key].id;
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        initForInner[key] = (init as any)[key];
                    }
                }

                raw = rawOwner.createMap(initForInner);
            } else {
                throw new Error("Expected init and options");
            }

            this._raw = raw;
            this.id = raw.id as unknown as ID<CoMap<Shape>>;
            this.meta = new CoMapMeta<Shape>(raw);
            this._refs = {};
        }

        static fromRaw(
            raw: RawCoMap<RawShape<Shape>>,
            onGetRef?: (id: ID<CoValue>) => void
        ): CoMap<Shape> {
            return new CoMapSchemaForShape(undefined, {
                fromRaw: raw,
                onGetRef,
            }) as CoMap<Shape>;
        }

        static load(
            id: ID<CoMap<Shape>>,
            { as }: { as: ControlledAccount }
        ): Promise<CoMap<Shape>> {
            throw new Error("not yet implemented");
        }

        subscribe(listener: (newValue: CoMap<Shape>) => void): () => void {
            const refSubscriptions: Map<ID<CoValue>, () => void> = new Map();

            const render = () => {
                return CoMapSchemaForShape.fromRaw(
                    this._raw.core.getCurrentContent() as typeof this._raw,
                    (accessedRefID) => {
                        if (!refSubscriptions.get(accessedRefID)) {
                            const unsusbscribeRef =
                                this._raw.core.node.subscribe(
                                    accessedRefID as unknown as CoID<RawCoValue>,
                                    scheduleNotify
                                );

                            refSubscriptions.set(
                                accessedRefID,
                                unsusbscribeRef
                            );
                        }
                    }
                );
            };

            let scheduled = false;

            const scheduleNotify = () => {
                if (!scheduled) {
                    scheduled = true;
                    void Promise.resolve().then(() => {
                        scheduled = false;
                        listener(render());
                    });
                }
            };

            const unsubscribeThis = this._raw.core.subscribe(scheduleNotify);

            return () => {
                unsubscribeThis();
                refSubscriptions.forEach((unsubscribeRef) => {
                    unsubscribeRef();
                });
            };
        }
    }

    for (const key in SchemaShape) {
        const KeySchema = SchemaShape[key];

        if (isCoValueSchema(KeySchema)) {
            const KeyCoValueSchema = KeySchema as CoValueSchemaBase;
            Object.defineProperty(CoMapSchemaForShape.prototype, key, {
                get(this: CoMapSchemaForShape) {
                    let ref = this._refs[key];

                    if (!ref) {
                        const id = this._raw.get(key);

                        if (!id) {
                            // TODO: mark as not available in this view of the comap, even if it loads and we access it again?
                            return undefined;
                        }

                        const raw = this._raw.core.node.getLoaded(
                            id as unknown as CoID<
                                (typeof KeyCoValueSchema)["_RawValue"]
                            >
                        );

                        if (!raw) {
                            return undefined;
                        } else {
                            ref = KeyCoValueSchema.fromRaw(
                                raw as unknown as (typeof KeyCoValueSchema)["_RawValue"],
                                this._onGetRef
                            ) as Shape[keyof Shape]["_Value"];

                            this._refs[key] = ref;
                        }
                    }

                    this._onGetRef?.(ref.id);

                    return ref;
                },
                set(this: CoMapSchemaForShape, _value) {
                    // TODO
                },
            });
        } else {
            Object.defineProperty(CoMapSchemaForShape.prototype, key, {
                get(this: CoMapSchemaForShape) {
                    return this._raw.get(key);
                },
                set(this: CoMapSchemaForShape, value) {
                    this._raw.set(key, value);
                },
            });
        }
    }

    return CoMapSchemaForShape as CoMapSchema<Shape>;
}

class CoMapMeta<Shape extends BaseCoMapShape> {
    _raw: RawCoMap<RawShape<Shape>>;
    owner: Account | Group;

    constructor(raw: RawCoMap<RawShape<Shape>>) {
        this._raw = raw;
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = Group.fromRaw(rawOwner);
        }
    }
}
