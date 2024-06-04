import type { CojsonInternalTypes, RawCoPlainText } from "cojson";
import { RawAccount, stringifyOpID } from "cojson";
import type {
    AccountCtx,
    CoValue,
    CoValueClass,
    ID,
    UnavailableError,
} from "../internal.js";
import { Account, Group, inspect, loadCoValue, loadCoValueEf, subscribeToCoValue, subscribeToCoValueEf, subscribeToExistingCoValue } from "../internal.js";
import type { Effect, Stream } from "effect";

export type TextPos = CojsonInternalTypes.OpID;

export class CoPlainText
    extends String
    implements CoValue
{
    declare id: ID<this>;
    declare _type: "CoPlainText";
    declare _raw: RawCoPlainText;

    get _owner(): Account | Group {
        return this._raw.group instanceof RawAccount
            ? Account.fromRaw(this._raw.group)
            : Group.fromRaw(this._raw.group);
    }

    get _loadedAs() {
        return Account.fromNode(this._raw.core.node);
    }

    constructor(options: { fromRaw: RawCoPlainText } | { text: string, owner: Account | Group }) {
        super();

        let raw;

        if ("fromRaw" in options)  {
            raw = options.fromRaw;
        } else {
            raw = options.owner._raw.createPlainText(options.text);
        }

        Object.defineProperties(this, {
            id: { value: raw.id, enumerable: false },
            _type: { value: "CoPlainText", enumerable: false },
            _raw: { value: raw, enumerable: false },
        });
    }

    static create<T extends CoPlainText>(this: CoValueClass<T>, text: string, options: { owner: Account | Group }) {
        return new this({ text, owner: options.owner });
    }

    toString() {
        return this._raw.toString();
    }

    valueOf() {
        return this._raw.toString();
    }

    toJSON(): string {
        return this._raw.toString();
    }

    [inspect]() {
        return this.toJSON();
    }

    insertAfter(idx: number, text: string) {
        this._raw.insertAfter(idx, text);
    }

    deleteFrom(idx: number, length: number) {
        this._raw.deleteFrom(idx, length);
    }

    posBefore(idx: number): TextPos | undefined {
        return this._raw.mapping.opIDbeforeIdx[idx];
    }

    posAfter(idx: number): TextPos | undefined {
        return this._raw.mapping.opIDafterIdx[idx];
    }

    idxBefore(pos: TextPos): number | undefined {
        return this._raw.mapping.idxBeforeOpID[stringifyOpID(pos)];
    }

    idxAfter(pos: TextPos): number | undefined {
        return this._raw.mapping.idxAfterOpID[stringifyOpID(pos)];
    }

    static fromRaw<V extends CoPlainText>(
        this: CoValueClass<V> & typeof CoPlainText,
        raw: RawCoPlainText
    ) {
        return new this({ fromRaw: raw });
    }

    /**
     * Load a `CoPlainText` with a given ID, as a given account.
     *
     * `depth` specifies which (if any) fields that reference other CoValues to load as well before resolving.
     * The `DeeplyLoaded` return type guarantees that corresponding referenced CoValues are loaded to the specified depth.
     *
     * You can pass `[]` or `{}` for shallowly loading only this CoPlainText, or `{ fieldA: depthA, fieldB: depthB }` for recursively loading referenced CoValues.
     *
     * Check out the `load` methods on `CoMap`/`CoList`/`CoStream`/`Group`/`Account` to see which depth structures are valid to nest.
     *
     * @example
     * ```ts
     * const person = await Person.load(
     *   "co_zdsMhHtfG6VNKt7RqPUPvUtN2Ax",
     *   me,
     *   { pet: {} }
     * );
     * ```
     *
     * @category Subscription & Loading
     */
    static load<T extends CoPlainText>(
        this: CoValueClass<T>,
        id: ID<T>,
        as: Account,
    ): Promise<T | undefined> {
        return loadCoValue(this, id, as, []);
    }

    /**
     * Effectful version of `CoMap.load()`.
     *
     * Needs to be run inside an `AccountCtx` context.
     *
     * @category Subscription & Loading
     */
    static loadEf<T extends CoPlainText>(
        this: CoValueClass<T>,
        id: ID<T>,
    ): Effect.Effect<T, UnavailableError, AccountCtx> {
        return loadCoValueEf(this, id, []);
    }

    /**
     * Load and subscribe to a `CoMap` with a given ID, as a given account.
     *
     * Automatically also subscribes to updates to all referenced/nested CoValues as soon as they are accessed in the listener.
     *
     * `depth` specifies which (if any) fields that reference other CoValues to load as well before calling `listener` for the first time.
     * The `DeeplyLoaded` return type guarantees that corresponding referenced CoValues are loaded to the specified depth.
     *
     * You can pass `[]` or `{}` for shallowly loading only this CoMap, or `{ fieldA: depthA, fieldB: depthB }` for recursively loading referenced CoValues.
     *
     * Check out the `load` methods on `CoMap`/`CoList`/`CoStream`/`Group`/`Account` to see which depth structures are valid to nest.
     *
     * Returns an unsubscribe function that you should call when you no longer need updates.
     *
     * Also see the `useCoState` hook to reactively subscribe to a CoValue in a React component.
     *
     * @example
     * ```ts
     * const unsub = Person.subscribe(
     *   "co_zdsMhHtfG6VNKt7RqPUPvUtN2Ax",
     *   me,
     *   { pet: {} },
     *   (person) => console.log(person)
     * );
     * ```
     *
     * @category Subscription & Loading
     */
    static subscribe<T extends CoPlainText>(
        this: CoValueClass<T>,
        id: ID<T>,
        as: Account,
        listener: (value: T) => void,
    ): () => void {
        return subscribeToCoValue(this, id, as, [], listener);
    }

    /**
     * Effectful version of `CoMap.subscribe()` that returns a stream of updates.
     *
     * Needs to be run inside an `AccountCtx` context.
     *
     * @category Subscription & Loading
     */
    static subscribeEf<T extends CoPlainText>(
        this: CoValueClass<T>,
        id: ID<T>,
    ): Stream.Stream<T, UnavailableError, AccountCtx> {
        return subscribeToCoValueEf(this, id, []);
    }

    /**
     * Given an already loaded `CoMap`, subscribe to updates to the `CoMap` and ensure that the specified fields are loaded to the specified depth.
     *
     * Works like `CoMap.subscribe()`, but you don't need to pass the ID or the account to load as again.
     *
     * Returns an unsubscribe function that you should call when you no longer need updates.
     *
     * @category Subscription & Loading
     **/
    subscribe<T extends CoPlainText>(
        this: T,
        listener: (value: T) => void,
    ): () => void {
        return subscribeToExistingCoValue(this, [], listener);
    }
}
