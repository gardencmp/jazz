import { RawCoList as RawCoList } from "cojson";
import { RawType } from "../../baseInterfaces.js";
import { ID } from "../../id.js";
import { CoValueSchemaBase, CoValueBase } from "../../baseInterfaces.js";
import { Schema } from "../../schema.js";
import { Account } from "../account/account.js";
import { Group } from "../group/group.js";
import { CoListMeta } from "./meta.js";

/** A collaborative list of values that behaves mostly like an `Array`.
 *
 * Can be created by instatiating a `CoListSchema`.
 *
 * @category CoValues - CoList */
export interface CoList<Item extends Schema = Schema>
    extends Array<Item["_Value"]>,
        CoValueBase {
    /** @category Collaboration */
    id: ID<CoList<Item>>;
    /** @category Collaboration */
    meta: CoListMeta<Item>;
    /** @hidden */
    _raw: RawCoList<RawType<Item>>;

    /** @category Properties */
    length: number;

    /** @category Access & Finding */
    [index: number]: Item["_Value"];

    /** @category Access & Finding */
    at(index: number): Item["_Value"];

    /** @category Access & Finding */
    indexOf(searchElement: Item["_Value"], fromIndex?: number): number;

    /** @category Access & Finding */
    lastIndexOf(searchElement: Item["_Value"], fromIndex?: number): number;

    /** @category Access & Finding */
    includes(searchElement: Item["_Value"], fromIndex?: number): boolean;

    /** @category Mapping & Transformation */
    slice(start?: number, end?: number): Item["_Value"][];

    /** @category Mapping & Transformation */
    concat(...items: Item["_Value"][][]): Item["_Value"][];

    /** @category Mapping & Transformation */
    join(separator?: string): string;

    /** @category Mapping & Transformation */
    toString(): string;

    /** @category Mapping & Transformation */
    toLocaleString(): string;

    /** @category Iteration */
    entries(): IterableIterator<[number, Item["_Value"]]>;

    /** @category Iteration */
    keys(): IterableIterator<number>;

    /** @category Iteration */
    values(): IterableIterator<Item["_Value"]>;

    /** @category Iteration */
    [Symbol.iterator](): IterableIterator<Item["_Value"]>;

    /** @category Iteration */
    forEach(
        callbackfn: (
            value: Item["_Value"],
            index: number,
            array: Item["_Value"][]
        ) => void,
        thisArg?: unknown
    ): void;

    /** @category Mapping & Transformation */
    filter(
        callbackfn: (
            value: Item["_Value"],
            index: number,
            array: Item["_Value"][]
        ) => boolean,
        thisArg?: unknown
    ): Item["_Value"][];

    /** @category Mapping & Transformation */
    map<U>(
        callbackfn: (
            value: Item["_Value"],
            index: number,
            array: Item["_Value"][]
        ) => U,
        thisArg?: unknown
    ): U[];

    /** @category Access & Finding */
    find(
        predicate: (
            value: Item["_Value"],
            index: number,
            obj: Item["_Value"][]
        ) => boolean,
        thisArg?: unknown
    ): Item["_Value"] | undefined;

    /** @category Access & Finding */
    findIndex(
        predicate: (
            value: Item["_Value"],
            index: number,
            obj: Item["_Value"][]
        ) => boolean,
        thisArg?: unknown
    ): number;

    /** @category Mapping & Transformation */
    reduce<U>(
        callbackfn: (
            previousValue: U,
            currentValue: Item["_Value"],
            currentIndex: number,
            array: Item["_Value"][]
        ) => U,
        initialValue: U
    ): U;

    /** @category Mapping & Transformation */
    reduce(
        callbackfn: (
            previousValue: Item["_Value"],
            currentValue: Item["_Value"],
            currentIndex: number,
            array: Item["_Value"][]
        ) => Item["_Value"]
    ): Item["_Value"];

    /** @category Mapping & Transformation */
    reduceRight<U>(
        callbackfn: (
            previousValue: U,
            currentValue: Item["_Value"],
            currentIndex: number,
            array: Item["_Value"][]
        ) => U,
        initialValue: U
    ): U;

    /** @category Mapping & Transformation */
    reduceRight(
        callbackfn: (
            previousValue: Item["_Value"],
            currentValue: Item["_Value"],
            currentIndex: number,
            array: Item["_Value"][]
        ) => Item["_Value"]
    ): Item["_Value"];

    /** @category Access & Finding */
    some(
        callbackfn: (
            value: Item["_Value"],
            index: number,
            array: Item["_Value"][]
        ) => unknown,
        thisArg?: unknown
    ): boolean;

    /** @category Access & Finding */
    every(
        callbackfn: (
            value: Item["_Value"],
            index: number,
            array: Item["_Value"][]
        ) => unknown,
        thisArg?: unknown
    ): boolean;

    /** @category Mutation */
    push(...items: Item["_Value"][]): number;
    /** @category Mutation */
    unshift(..._items: Item["_Value"][]): number;

    /** @category Mutation */
    splice(start: number, deleteCount: 1): [Item["_Value"]];

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    splice(start: number, deleteCount?: number | undefined): Item["_Value"][];
    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    splice(
        start: number,
        deleteCount: number,
        ...items: Item["_Value"][]
    ): Item["_Value"][];

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    pop(): Item["_Value"] | undefined;

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    shift(): Item["_Value"] | undefined;

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    reverse(): Item["_Value"][];

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    sort(
        _compareFn?:
            | ((a: Item["_Value"], b: Item["_Value"]) => number)
            | undefined
    ): this;

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    copyWithin(
        _target: number,
        _start: number,
        _end?: number | undefined
    ): this;

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    fill(
        _value: Item["_Value"],
        _start?: number | undefined,
        _end?: number | undefined
    ): this;
}

/** @category CoValues - CoList */
export interface CoListSchema<Item extends Schema = Schema>
    extends Schema<CoList<Item>>,
        CoValueSchemaBase<CoList<Item>, RawCoList<RawType<Item>>> {
    /** @category Type Tag */
    _Type: "colist";
    /** @category Type Hints */
    _Item: Item;
    /** @category Type Hints */
    _Value: CoList<Item>;

    /** @category Value Creation */
    new (
        owner: Account | Group,
        init: Item["_Value"][],
    ): CoList<Item>;

    /** @hidden */
    fromRaw(raw: RawCoList<RawType<Item>>): CoList<Item>;
}
