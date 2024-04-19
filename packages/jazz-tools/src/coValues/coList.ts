import type { RawCoList } from "cojson";
import { RawAccount } from "cojson";
import type { Effect, Stream } from "effect";
import type {
    AccountCtx,
    CoValue,
    ValidItem,
    Encoding,
    EncodingFor,
    ID,
    RefEncoded,
    SubclassedConstructor,
    UnavailableError,
    IsVal,
} from "../internal.js";
import {
    Account,
    CoValueBase,
    Group,
    InitValues,
    ItemsSym,
    Ref,
    SchemaInit,
    val,
    inspect,
    makeRefs,
} from "../internal.js";
import { Schema } from "@effect/schema";

export class CoList<Item extends ValidItem<Item, "CoList"> = any>
    extends Array<Item>
    implements CoValue<"CoList", RawCoList>
{
    static Of<Item extends ValidItem<Item, "CoList"> = any>(
        item: IsVal<Item, Item>
    ): typeof CoList<Item> {
        return class CoListOf extends CoList<Item> {
            [val.items] = item;
        };
    }

    /** @deprecated Use UPPERCASE `CoList.Of` instead! */
    static of(..._args: never): never {
        throw new Error("Can't use Array.of with CoLists");
    }

    id!: ID<this>;
    _type!: "CoList";
    static {
        this.prototype._type = "CoList";
    }
    _raw!: RawCoList;

    /** @internal This is only a marker type and doesn't exist at runtime */
    [ItemsSym]!: Item;
    static _encoding: any;
    get _encoding(): {
        [ItemsSym]: EncodingFor<Item>;
    } {
        return (this.constructor as typeof CoList)._encoding;
    }

    get _owner(): Account | Group {
        return this._raw.group instanceof RawAccount
            ? Account.fromRaw(this._raw.group)
            : Group.fromRaw(this._raw.group);
    }

    get _refs(): {
        [idx: number]: NonNullable<Item> extends CoValue
            ? Ref<NonNullable<Item>>
            : never;
    } & {
        length: number;
        [Symbol.iterator](): IterableIterator<
            NonNullable<Item> extends CoValue ? Ref<NonNullable<Item>> : never
        >;
    } {
        return makeRefs<number>(
            (idx) => this._raw.get(idx) as unknown as ID<CoValue>,
            () =>
                Array.from(
                    { length: this._raw.entries().length },
                    (_, idx) => idx
                ),
            this._loadedAs,
            (_idx) => this._encoding[ItemsSym] as RefEncoded<CoValue>
        ) as any;
    }

    get _edits(): {
        [idx: number]: {
            value?: Item;
            ref?: Item extends CoValue ? Ref<Item> : never;
            by?: Account;
            madeAt: Date;
        };
    } {
        throw new Error("Not implemented");
    }

    get _loadedAs() {
        return Account.fromNode(this._raw.core.node);
    }

    [InitValues]?: {
        init: Item[];
        owner: Account | Group;
    };

    static get [Symbol.species]() {
        return Array;
    }

    constructor(_init: undefined, options: { fromRaw: RawCoList });
    constructor(init: Item[], options: { owner: Account | Group });
    constructor(
        init: Item[] | undefined,
        options?: { owner: Account | Group } | { fromRaw: RawCoList }
    ) {
        super();

        if (!options) {
            throw new Error("Must provide options");
        }

        if (init && "owner" in options) {
            this[InitValues] = {
                init,
                owner: options.owner,
            };
        } else if ("fromRaw" in options) {
            Object.defineProperties(this, {
                id: {
                    value: options.fromRaw.id,
                    enumerable: false,
                },
                _raw: { value: options.fromRaw, enumerable: false },
            });
        }

        return new Proxy(this, CoListProxyHandler as ProxyHandler<this>);
    }

    push(...items: Item[]): number;
    /** @private For exact type compatibility with Array superclass */
    push(...items: Item[]): number;
    push(...items: Item[]): number {
        for (const item of toRawItems(
            items as Item[],
            this._encoding[ItemsSym]
        )) {
            this._raw.append(item);
        }

        return this._raw.entries().length;
    }

    unshift(...items: Item[]): number;
    /** @private For exact type compatibility with Array superclass */
    unshift(...items: Item[]): number;
    unshift(...items: Item[]): number {
        for (const item of toRawItems(
            items as Item[],
            this._encoding[ItemsSym]
        )) {
            this._raw.prepend(item);
        }

        return this._raw.entries().length;
    }

    pop(): Item | undefined {
        const last = this[this.length - 1];

        this._raw.delete(this.length - 1);

        return last;
    }

    shift(): Item | undefined {
        const first = this[0];

        this._raw.delete(0);

        return first;
    }

    splice(start: number, deleteCount: number, ...items: Item[]): Item[];
    splice(start: number, deleteCount: number, ...items: Item[]): Item[];
    splice(start: number, deleteCount: number, ...items: Item[]): Item[] {
        const deleted = this.slice(start, start + deleteCount);

        for (
            let idxToDelete = start + deleteCount;
            idxToDelete > start;
            idxToDelete--
        ) {
            this._raw.delete(idxToDelete);
        }

        let appendAfter = start;
        for (const item of toRawItems(
            items as Item[],
            this._encoding[ItemsSym]
        )) {
            this._raw.append(item, appendAfter);
            appendAfter++;
        }

        return deleted;
    }

    toJSON() {
        const itemDescriptor = this._encoding[ItemsSym] as Encoding;
        if (itemDescriptor === "json") {
            return this._raw.asArray();
        } else if ("encoded" in itemDescriptor) {
            return this._raw
                .asArray()
                .map((e) => Schema.encodeSync(itemDescriptor.encoded)(e));
        } else if ("ref" in itemDescriptor) {
            return this.map((item) => (item as unknown as CoValue)?.toJSON());
        } else {
            return [];
        }
    }

    [inspect]() {
        return this.toJSON();
    }

    subscribe!: (listener: (update: this) => void) => () => void;
    static {
        this.prototype.subscribe = CoValueBase.prototype.subscribe as any;
    }

    subscribeEf!: () => Stream.Stream<this, "unavailable", never>;
    static {
        this.prototype.subscribeEf = CoValueBase.prototype.subscribeEf as any;
    }

    static fromRaw<V extends CoList>(
        this: SubclassedConstructor<V> & typeof CoList,
        raw: RawCoList
    ) {
        return new this(undefined, { fromRaw: raw });
    }

    static loadEf = CoValueBase.loadEf as unknown as <V extends CoValue>(
        this: SubclassedConstructor<V>,
        id: ID<V>
    ) => Effect.Effect<V, UnavailableError, AccountCtx>;
    static load = CoValueBase.load as unknown as <V extends CoValue>(
        this: SubclassedConstructor<V>,
        id: ID<V>,
        options: { as: Account | Group }
    ) => Promise<V | undefined>;
    static subscribeEf = CoValueBase.subscribeEf as unknown as <
        V extends CoValue,
    >(
        this: SubclassedConstructor<V>,
        id: ID<V>
    ) => Stream.Stream<V, UnavailableError, AccountCtx>;
    static subscribe = CoValueBase.subscribe as unknown as <V extends CoValue>(
        this: SubclassedConstructor<V>,
        id: ID<V>,
        options: { as: Account | Group },
        onUpdate: (value: V) => void
    ) => () => void;

    static encoding<V extends CoList>(
        this: { new (...args: any): V } & typeof CoList,
        def: { [ItemsSym]: V["_encoding"][ItemsSym] }
    ) {
        this._encoding ||= {};
        Object.assign(this._encoding, def);
    }
}

function toRawItems<Item>(items: Item[], itemDescriptor: Encoding) {
    const rawItems =
        itemDescriptor === "json"
            ? items
            : "encoded" in itemDescriptor
              ? items?.map((e) => Schema.encodeSync(itemDescriptor.encoded)(e))
              : "ref" in itemDescriptor
                ? items?.map((v) => (v as unknown as CoValue).id)
                : (() => {
                      throw new Error("Invalid element descriptor");
                  })();
    return rawItems;
}

function init(list: CoList) {
    if (list[InitValues]) {
        const { init, owner } = list[InitValues];
        const raw = owner._raw.createList(
            toRawItems(init, list._encoding[ItemsSym])
        );

        Object.defineProperties(list, {
            id: {
                value: raw.id,
                enumerable: false,
            },
            _raw: { value: raw, enumerable: false },
        });
        delete list[InitValues];
    }
}

const CoListProxyHandler: ProxyHandler<CoList> = {
    get(target, key, receiver) {
        if (typeof key === "string" && !isNaN(+key)) {
            const itemDescriptor = target._encoding[ItemsSym] as Encoding;
            const rawValue = target._raw.get(Number(key));
            if (itemDescriptor === "json") {
                return rawValue;
            } else if ("encoded" in itemDescriptor) {
                return rawValue === undefined
                    ? undefined
                    : Schema.decodeSync(itemDescriptor.encoded)(rawValue);
            } else if ("ref" in itemDescriptor) {
                return rawValue === undefined
                    ? undefined
                    : new Ref(
                          rawValue as unknown as ID<CoValue>,
                          target._loadedAs,
                          itemDescriptor
                      ).accessFrom(receiver);
            }
        } else if (key === "length") {
            return target._raw.entries().length;
        } else {
            return Reflect.get(target, key, receiver);
        }
    },
    set(target, key, value, receiver) {
        if (
            key === ItemsSym &&
            typeof value === "object" &&
            SchemaInit in value
        ) {
            (target.constructor as typeof CoList)._encoding ||= {};
            (target.constructor as typeof CoList)._encoding[ItemsSym] =
                value[SchemaInit];
            init(target);
            return true;
        }
        if (typeof key === "string" && !isNaN(+key)) {
            const itemDescriptor = target._encoding[ItemsSym] as Encoding;
            let rawValue;
            if (itemDescriptor === "json") {
                rawValue = value;
            } else if ("encoded" in itemDescriptor) {
                rawValue = Schema.encodeSync(itemDescriptor.encoded)(value);
            } else if ("ref" in itemDescriptor) {
                rawValue = value.id;
            }
            target._raw.replace(Number(key), rawValue);
            return true;
        } else {
            return Reflect.set(target, key, value, receiver);
        }
    },
    defineProperty(target, key, descriptor) {
        if (
            descriptor.value &&
            key === ItemsSym &&
            typeof descriptor.value === "object" &&
            SchemaInit in descriptor.value
        ) {
            (target.constructor as typeof CoList)._encoding ||= {};
            (target.constructor as typeof CoList)._encoding[ItemsSym] =
                descriptor.value[SchemaInit];
            init(target);
            return true;
        } else {
            return Reflect.defineProperty(target, key, descriptor);
        }
    },
    has(target, key) {
        if (typeof key === "string" && !isNaN(+key)) {
            return Number(key) < target._raw.entries().length;
        } else {
            return Reflect.has(target, key);
        }
    },
};
