import { JsonValue } from "../jsonValue.js";
import { MutableCoStream } from "../coValues/coStream.js";
import { CoValueCore } from "../coValueCore.js";
import { Group } from "../group.js";
import { AccountID, isAccountID } from "../account.js";
import { AnyCoStream, CoID, CoValue } from "../coValue.js";
import { SessionID, TransactionID } from "../ids.js";
import { QueriedAccountAndProfile } from "./queriedCoMap.js";
import { ValueOrSubQueried, QueryContext } from "../queries.js";


export type QueriedCoStreamItems<Item extends JsonValue | CoValue> = {
    last?: ValueOrSubQueried<Item>;
    by?: QueriedAccountAndProfile;
    tx?: TransactionID;
    at?: Date;
    all: {
        value: ValueOrSubQueried<Item>;
        by?: QueriedAccountAndProfile;
        tx: TransactionID;
        at: Date;
    }[];
};

export class QueriedCoStream<S extends AnyCoStream> {
    coStream: S;
    id: CoID<S>;
    type = "costream" as const;

    /** @internal */
    constructor(coStream: S, queryContext: QueryContext) {
        this.coStream = coStream;
        this.id = coStream.id;

        this.perSession = Object.fromEntries(
            coStream.sessions().map((sessionID) => {
                const items = [...coStream.itemsIn(sessionID)].map((item) => ({
                    by: item.by && isAccountID(item.by)
                        ? queryContext.resolveAccount(item.by)
                        : undefined,
                    tx: item.tx,
                    at: new Date(item.at),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value: queryContext.resolveValue(item.value) as any,
                }));

                const lastItem = items[items.length - 1];

                return [
                    sessionID,
                    {
                        last: lastItem?.value,
                        by: lastItem?.by,
                        tx: lastItem?.tx,
                        at: lastItem?.at,
                        all: items,
                    } satisfies QueriedCoStreamItems<S["_item"]>,
                ];
            })
        );

        this.perAccount = Object.fromEntries(
            [...coStream.accounts()].map((accountID) => {
                const items = [...coStream.itemsBy(accountID)].map((item) => ({
                    by: item.by && isAccountID(item.by)
                        ? queryContext.resolveAccount(item.by)
                        : undefined,
                    tx: item.tx,
                    at: new Date(item.at),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value: queryContext.resolveValue(item.value) as any,
                }));

                const lastItem = items[items.length - 1];

                return [
                    accountID,
                    {
                        last: lastItem?.value,
                        by: lastItem?.by,
                        tx: lastItem?.tx,
                        at: lastItem?.at,
                        all: items,
                    } satisfies QueriedCoStreamItems<S["_item"]>,
                ];
            })
        );

        this.me = isAccountID(queryContext.node.account.id)
            ? this.perAccount[queryContext.node.account.id]
            : undefined;
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

    me?: QueriedCoStreamItems<S["_item"]>;
    perAccount: {
        [account: AccountID]: QueriedCoStreamItems<S["_item"]>;
    };
    perSession: {
        [session: SessionID]: QueriedCoStreamItems<S["_item"]>;
    };

    push(
        item: S["_item"] extends CoValue ? S["_item"] | CoID<S["_item"]> : S["_item"],
        privacy?: "private" | "trusting"
    ): S {
        return this.coStream.push(item, privacy);
    }
    mutate(
        mutator: (mutable: MutableCoStream<S["_item"], S["meta"]>) => void
    ): S {
        return this.coStream.mutate(mutator);
    }
}
