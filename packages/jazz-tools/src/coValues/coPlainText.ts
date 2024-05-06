import type { CojsonInternalTypes, RawCoPlainText } from "cojson";
import { RawAccount, stringifyOpID } from "cojson";
import type {
    AccountCtx,
    CoValue,
    ID,
    SubclassedConstructor,
    UnavailableError,
} from "../internal.js";
import { Account, CoValueBase, Group, inspect } from "../internal.js";
import type { Effect, Stream } from "effect";

export type TextPos = CojsonInternalTypes.OpID;

export class CoPlainText
    extends String
    implements CoValue<"CoPlainText", RawCoPlainText>
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

    static create<T extends CoPlainText>(this: SubclassedConstructor<T>, text: string, options: { owner: Account | Group }) {
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

    subscribe!: (listener: (update: this) => void) => () => void;
    static {
        this.prototype.subscribe = CoValueBase.prototype.subscribe as any;
    }

    subscribeEf!: () => Stream.Stream<this, "unavailable", never>;
    static {
        this.prototype.subscribeEf = CoValueBase.prototype.subscribeEf as any;
    }

    static fromRaw<V extends CoPlainText>(
        this: SubclassedConstructor<V> & typeof CoPlainText,
        raw: RawCoPlainText
    ) {
        return new this({ fromRaw: raw });
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
}
