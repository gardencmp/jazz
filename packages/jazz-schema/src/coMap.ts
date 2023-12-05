import { CoID, CoValue as RawCoValue } from "cojson";
import {
    Schema,
    ID,
    RawType,
    isCoValueClass,
    PrimitiveOrRawID,
    CoValue,
} from ".";
import { Group } from "./group";
import { Account } from "./account";
import { RawCoID } from "cojson/src/ids";

type BaseCoMapShape = { [key: string]: Schema };

export type CoMap<Shape extends BaseCoMapShape = BaseCoMapShape> = {
    [Key in keyof Shape]: Shape[Key]["_Value"] extends CoValue
        ? Shape[Key]["_Value"] | undefined
        : Shape[Key]["_Value"];
} & {
    id: ID<CoMap<Shape>>;
    meta: CoMapMeta<Shape>;
    subscribe: (listener: (newValue: CoMap<Shape>) => void) => () => void;
};

export interface CoMapClass<Shape extends BaseCoMapShape = BaseCoMapShape>
    extends Schema<CoMap<Shape>> {
    _Type: "comap";
    _Shape: Shape;

    new (init: CoMapInit<Shape>, opts: { owner: any }): CoMap<Shape>;
    new (
        init: undefined,
        opts: { fromRaw: RawType<CoMapClass<Shape>> }
    ): CoMap<Shape>;

    fromRaw(
        raw: RawType<CoMapClass<Shape>>,
        onGetRef?: (id: ID<CoValue>) => void
    ): CoMap<Shape>;
}

export function isCoMapClass(value: any): value is CoMapClass {
    return (
        typeof value === "object" && value !== null && value._Type === "comap"
    );
}

export function isCoMap(value: any): value is CoMap {
    return isCoMapClass(value) && "id" in value;
}

export type CoMapInit<Shape extends BaseCoMapShape> = {
    [Key in keyof Shape as null extends Shape[Key]["_Value"]
        ? never
        : Key]?: Shape[Key]["_Value"];
} & {
    [Key in keyof Shape as null extends Shape[Key]["_Value"] ? Key : never]?:
        | Shape[Key]["_Value"]
        | null
        | undefined;
};

export function CoMapOf<Shape extends BaseCoMapShape>(
    SchemaShape: Shape
): CoMapClass<Shape> {
    class CoMapClassForShape {
        static _Type = "comap" as const;
        static _Shape = SchemaShape;
        static _Value: CoMap<Shape> = "CoMap<Shape>" as any;

        _raw: RawType<CoMapClass<Shape>>;
        _refs: { [key in keyof Shape]?: Shape[key]["_Value"] };
        _onGetRef?: (id: ID<CoValue>) => void;
        id: ID<CoMap<Shape>>;
        meta: CoMapMeta<Shape>;

        constructor(init: CoMapInit<Shape>, opts: { owner: any });
        constructor(
            init: undefined,
            options: {
                fromRaw: RawType<CoMapClass<Shape>>;
                onGetRef?: (id: ID<CoValue>) => void;
            }
        );
        constructor(
            init: CoMapInit<Shape> | undefined,
            options:
                | { owner: Group | Account }
                | { fromRaw: RawType<CoMapClass<Shape>>, onGetRef?: (id: ID<CoValue>) => void; }
        ) {
            let raw: RawType<CoMapClass<Shape>>;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
                this._onGetRef = options.onGetRef;
            } else if (init && options.owner) {
                const rawOwner = options.owner._raw;

                const initForInner = {} as any;

                for (const key in init) {
                    const keySchema = SchemaShape[key];

                    if (isCoValueClass(keySchema)) {
                        initForInner[key] = init[key as keyof typeof init].id;
                    } else {
                        initForInner[key] = init[key as keyof typeof init];
                    }
                }

                raw = rawOwner.createMap(initForInner);
            } else {
                throw new Error("Expected init and options");
            }

            this._raw = raw;
            this.id = raw.id as any;
            this.meta = new CoMapMeta<Shape>(raw);
            this._refs = {};
        }

        static fromRaw(
            raw: RawType<CoMapClass<Shape>>,
            onGetRef?: (id: ID<CoValue>) => void
        ): CoMap<Shape> {
            return new CoMapClassForShape(undefined, {
                fromRaw: raw,
                onGetRef,
            }) as CoMap<Shape>;
        }

        subscribe(listener: (newValue: CoMap<Shape>) => void): () => void {
            const refSubscriptions: Map<RawCoID, () => void> = new Map();

            const render = () => {
                return CoMapClassForShape.fromRaw(this._raw.core.getCurrentContent() as typeof this._raw,  (accessedRefID) => {
                    if (!refSubscriptions.get(accessedRefID)) {
                        const unsusbscribeRef = this._raw.core.node.subscribe(accessedRefID as CoID<RawCoValue>, scheduleNotify)

                        refSubscriptions.set(accessedRefID, unsusbscribeRef);
                    }
                });
            }

            let scheduled = false;

            const scheduleNotify = () => {
                if (!scheduled) {
                    scheduled = true;
                    Promise.resolve().then(() => {
                        scheduled = false;
                        listener(render());
                    });
                }
            }

            const unsubscribeThis = this._raw.core.subscribe(scheduleNotify);

            return () => {
                unsubscribeThis();
                refSubscriptions.forEach((unsubscribeRef) => {
                    unsubscribeRef();
                });
            }
        }
    };

    for (const key in SchemaShape) {
        const KeySchema = SchemaShape[key];

        if (isCoValueClass(KeySchema)) {
            Object.defineProperty(CoMapClassForShape.prototype, key, {
                get(this: CoMapClassForShape) {
                    let ref = this._refs[key];

                    if (!ref) {
                        const id = this._raw.get(key);

                        if (!id) {
                            // TODO: mark as not available in this view of the comap, even if it loads and we access it again?
                            return undefined;
                        }

                        const raw = this._raw.core.node.getLoaded(
                            id as PrimitiveOrRawID<
                                Shape[keyof Shape]
                            > as CoID<RawCoValue>
                        );

                        if (!raw) {
                            return undefined;
                        } else {
                            ref = KeySchema.fromRaw(
                                raw as any,
                                this._onGetRef
                            ) as Shape[keyof Shape]["_Value"];

                            this._refs[key] = ref;
                        }
                    }

                    this._onGetRef?.(ref.id);

                    return ref;
                },
                set(this: CoMapClassForShape, value) {
                    // TODO
                },
            });
        } else {
            Object.defineProperty(CoMapClassForShape.prototype, key, {
                get(this: CoMapClassForShape) {
                    this._raw.get(key);
                },
                set(this: CoMapClassForShape, value) {
                    this._raw.set(key, value);
                },
            });
        }
    }

    return CoMapClassForShape as CoMapClass<Shape>;
}

class CoMapMeta<Shape extends BaseCoMapShape> {
    _inner: RawType<CoMapClass<Shape>>;

    constructor(inner: RawType<CoMapClass<Shape>>) {
        this._inner = inner;
    }
}
