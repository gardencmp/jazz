import { CoMap, CojsonInternalTypes } from "cojson";
import {
    CoValue,
    ID,
    NullSchema,
    Primitive,
    Schema,
    SchemaToPrimitiveOrID,
    SyncState,
    UnionSchema,
    isCoValue,
} from ".";
import { CoListSchema, CoListValue } from "./coList.js";
import { AccountValue, ControlledAccountValue, GroupValue } from "./group.js";

export class CoMapSchema<
    Shape extends BaseCoMapShape = BaseCoMapShape
> extends Schema<CoMapValue<Shape>> {
    _shape: Shape;

    constructor(shape: Shape) {
        super();
        this._shape = shape;
    }
}

export type PartialCoMap<Schema extends CoMapSchema> =
    Schema extends CoMapSchema<infer Shape>
        ? CoMapSchema<{
              [Key in keyof Shape]: UnionSchema<[Shape[Key], NullSchema]>;
          }>
        : never;

type BaseCoMapShape = { [key: string]: Schema };

type CoMapEdit<Shape extends BaseCoMapShape, Key extends keyof Shape> = {
    by?: AccountValue;
    tx: CojsonInternalTypes.TransactionID;
    at: Date;
    value: Shape[Key]["_value"];
};

type CoMapLastAndAllEdits<
    Shape extends BaseCoMapShape,
    Key extends keyof Shape
> = CoMapEdit<Shape, Key> & {
    all: CoMapEdit<Shape, Key>[];
};

export type CoMapOwnProps<Shape extends BaseCoMapShape = BaseCoMapShape> = {
    [Key in keyof Shape]: Shape[Key]["_value"];
};

export type CoMapValue<Shape extends BaseCoMapShape = BaseCoMapShape> =
    CoMapOwnProps<Shape> & {
        _type: "comap";
        _inner: CoMap<CoMapNativeShape<Shape>>;
        id: ID<CoMapValue<Shape>>;
        meta: {
            edits: {
                [Key in keyof Shape & string]:
                    | CoMapLastAndAllEdits<Shape, Key>
                    | undefined;
            };
            sync: SyncState & {
                [Key in keyof Shape &
                    string as `${Key}ID`]: Shape[Key] extends CoMapSchema<
                    infer _
                >
                    ? SyncState
                    : Shape[Key] extends CoListSchema<infer _>
                    ? SyncState
                    : never;
            };
            refs: {
                [Key in keyof Shape &
                    string as `${Key}ID`]: Shape[Key] extends CoMapSchema<
                    infer Shape
                >
                    ? ID<CoMapValue<Shape>>
                    : Shape[Key] extends CoListSchema<infer Item>
                    ? ID<CoListValue<Item["_value"]>>
                    : never;
            };
        };
    };

export type CoMapClass<Shape extends BaseCoMapShape> = {
    new (
        init: CoMapValue<Shape>,
        { owner }: { owner: AccountValue | GroupValue }
    ): CoMapValue<Shape>;
    new ({ owner }: { owner: AccountValue | GroupValue }): CoMapValue<Shape>;

    load(
        id: ID<CoMapValue<Shape>>,
        { as }: { as: ControlledAccountValue }
    ): Promise<CoMapValue<Shape>>;
};

export type CoMapNativeShape<Shape extends BaseCoMapShape> = {
    [Key in keyof Shape]: SchemaToPrimitiveOrID<Shape[Key]>;
};

function coMapInitToNativeInit<Shape extends BaseCoMapShape>(
    init: CoMapOwnProps<Shape>
): CoMapNativeShape<Shape> {
    const nativeInit = {} as CoMapNativeShape<Shape>;

    for (const key in init) {
        const value: CoValue | Primitive = init[key];

        if (value) {
            if (isCoValue(value)) {
                nativeInit[key as keyof typeof nativeInit] =
                    value.id as CoMapNativeShape<Shape>[keyof CoMapNativeShape<Shape>];
            } else {
                nativeInit[key as keyof typeof nativeInit] =
                    value as CoMapNativeShape<Shape>[keyof CoMapNativeShape<Shape>];
            }
        }
    }

    return nativeInit;
}

export function isCoMap(value: any): value is CoMapValue {
    return (
        typeof value === "object" &&
        value instanceof CoMapSchema &&
        "id" in value
    );
}

export const createCoMapSchema = <Shape extends BaseCoMapShape>(
    shape: Shape
): CoMapSchema<Shape> & CoMapClass<Shape> => {
    const CoMapSchemaInstance = new CoMapSchema<Shape>(shape);

    class CoMapMeta {
        _inner: CoMap<CoMapNativeShape<Shape>>;

        constructor(_inner: CoMap<CoMapNativeShape<Shape>>) {
            this._inner = _inner;
        }
    }
    class CoMapFromSchema {
        id!: ID<CoMapValue<Shape>>;
        _inner!: CoMap<CoMapNativeShape<Shape>>;
        meta!: CoMapMeta;

        static fromInner(
            _inner: CoMap<CoMapNativeShape<Shape>>,
            onGetRef?: <Key extends keyof Shape>(
                key: Key,
                keySchema: Shape[Key]
            ) => void,
            onSetRef?: <Key extends keyof Shape>(
                key: Key,
                keySchema: Shape[Key],
                value: Shape[Key]["_value"]
            ) => void
        ): CoMapFromSchema {
            const instance = Object.create(
                CoMapFromSchema.prototype
            ) as CoMapFromSchema;

            instance._inner = _inner;
            instance.meta = new CoMapMeta(_inner);
            instance.id = _inner.id as unknown as ID<CoMapValue<Shape>>;

            return instance;
        }

        constructor(
            init: CoMapOwnProps<Shape>,
            { owner }: { owner: AccountValue | GroupValue }
        );
        constructor({ owner }: { owner: AccountValue | GroupValue });
        constructor(
            initOrOpts:
                | CoMapOwnProps<Shape>
                | { owner: AccountValue | GroupValue },
            opts?: { owner: AccountValue | GroupValue }
        ) {
            let init: CoMapOwnProps<Shape> | undefined;
            let owner: AccountValue | GroupValue;

            if (opts) {
                init = initOrOpts as CoMapOwnProps<Shape>;
                owner = opts.owner;
            } else {
                owner = initOrOpts.owner as AccountValue | GroupValue;
            }

            CoMapFromSchema.fromInner(
                owner._inner.createMap<CoMap<CoMapNativeShape<Shape>>>(
                    init && coMapInitToNativeInit(init)
                )
            );
        }
    }

    for (const key in shape) {
        const keySchema = shape[key];

        if (
            keySchema instanceof CoMapSchema ||
            keySchema instanceof CoListSchema
        ) {
            Object.defineProperty(this, key, {
                get() {
                    return this._inner.get(key);
                },
                set(value) {
                    this._inner.set(key, value);
                },
            });
        }
    }

    Object.setPrototypeOf(CoMapFromSchema.prototype, CoMapSchemaInstance);

    return CoMapFromSchema as unknown as CoMapSchema<Shape> & CoMapClass<Shape>;
};
