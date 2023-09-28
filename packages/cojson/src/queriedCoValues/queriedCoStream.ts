import { JsonValue } from "../jsonValue.js";
import { CoStream, MutableCoStream } from "../coValues/coStream.js";
import { CoValueCore } from "../coValueCore.js";
import { Group } from "../coValues/group.js";
import { AccountID, isAccountID } from "../coValues/account.js";
import { CoID, CoValue } from "../coValue.js";
import { SessionID, TransactionID } from "../ids.js";
import { ValueOrSubQueried, QueryContext } from "../queries.js";
import { QueriedAccount } from "./queriedAccount.js";

export type QueriedCoStreamEntry<Item extends JsonValue | CoValue> = {
    last?: ValueOrSubQueried<Item>;
    by?: QueriedAccount;
    tx?: TransactionID;
    at?: Date;
    all: {
        value: ValueOrSubQueried<Item>;
        by?: QueriedAccount;
        tx: TransactionID;
        at: Date;
    }[];
};

export class QueriedCoStream<S extends CoStream> {
    coStream!: S;
    id: CoID<S>;
    type = "costream" as const;

    /** @internal */
    constructor(coStream: S, queryContext: QueryContext) {
        Object.defineProperty(this, "coStream", {
            get() {
                return coStream;
            },
        });
        this.id = coStream.id;

        this.perSession = coStream.sessions().map((sessionID) => {
            const items = [...coStream.itemsIn(sessionID)].map((item) =>
                queryContext.defineSubqueryPropertiesIn(
                    {
                        tx: item.tx,
                        at: new Date(item.at),
                    },
                    {
                        by: {
                            value: isAccountID(item.by)
                                ? item.by
                                : (undefined as never),
                            enumerable: true,
                        },
                        value: {
                            value: item.value as S["_item"],
                            enumerable: true,
                        },
                    },
                    [coStream.id]
                )
            );

            const lastItem = items[items.length - 1];

            return [
                sessionID,
                {
                    get last() {
                        return lastItem?.value;
                    },
                    get by() {
                        return lastItem?.by;
                    },
                    tx: lastItem?.tx,
                    at: lastItem?.at,
                    all: items,
                } satisfies QueriedCoStreamEntry<S["_item"]>,
            ];
        });

        this.perAccount = [...coStream.accounts()].map((accountID) => {
            const items = [...coStream.itemsBy(accountID)].map((item) =>
                queryContext.defineSubqueryPropertiesIn(
                    {
                        tx: item.tx,
                        at: new Date(item.at),
                    },
                    {
                        by: {
                            value: isAccountID(item.by)
                                ? item.by
                                : (undefined as never),
                            enumerable: true,
                        },
                        value: {
                            value: item.value as S["_item"],
                            enumerable: true,
                        },
                    },
                    [coStream.id]
                )
            );

            const lastItem = items[items.length - 1];

            const entry = {
                get last() {
                    return lastItem?.value;
                },
                get by() {
                    return lastItem?.by;
                },
                tx: lastItem?.tx,
                at: lastItem?.at,
                all: items,
            } satisfies QueriedCoStreamEntry<S["_item"]>;

            if (accountID === queryContext.node.account.id) {
                this.me = entry;
            }

            return [
                accountID,
                entry
            ];
        });
    }

    get meta(): S["meta"] {
        return this.coStream.meta;
    }

    get group(): Group {
        return this.coStream.group;
    }

    get core(): CoValueCore {
        return this.coStream.core;
    }

    me?: QueriedCoStreamEntry<S["_item"]>;
    perAccount: [account: AccountID, items: QueriedCoStreamEntry<S["_item"]>][];
    perSession: [session: SessionID, items: QueriedCoStreamEntry<S["_item"]>][];

    push(item: S["_item"], privacy?: "private" | "trusting"): S {
        return this.coStream.push(item, privacy);
    }
    mutate(
        mutator: (mutable: MutableCoStream<S["_item"], S["meta"]>) => void
    ): S {
        return this.coStream.mutate(mutator);
    }
}
