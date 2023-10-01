import {
    CoValue,
    JsonValue,
    CojsonInternalTypes,
    CoStream,
    CoID,
    cojsonInternals,
    Group,
    AccountID,
    SessionID,
    MutableCoStream,
} from "cojson";
import { ValueOrResolvedRef, AutoSubContext } from "../autoSub.js";
import { ResolvedAccount } from "./resolvedAccount.js";

export type ResolvedCoStreamEntry<Item extends JsonValue | CoValue> = {
    last?: ValueOrResolvedRef<Item>;
    by?: ResolvedAccount;
    tx?: CojsonInternalTypes.TransactionID;
    at?: Date;
    all: {
        value: ValueOrResolvedRef<Item>;
        by?: ResolvedAccount;
        tx: CojsonInternalTypes.TransactionID;
        at: Date;
    }[];
};

export type ResolvedCoStreamMeta<S extends CoStream> = {
    coValue: S;
    headerMeta: S["headerMeta"];
    group: Group;
}

export class ResolvedCoStream<S extends CoStream> {
    id: CoID<S>;
    coValueType = "costream" as const;
    meta: ResolvedCoStreamMeta<S>;
    me?: ResolvedCoStreamEntry<S["_item"]>;
    perAccount: [account: AccountID, items: ResolvedCoStreamEntry<S["_item"]>][];
    perSession: [session: SessionID, items: ResolvedCoStreamEntry<S["_item"]>][];

    /** @internal */
    constructor(coStream: S, autoSubContext: AutoSubContext) {
        this.id = coStream.id;
        this.meta = {
            coValue: coStream,
            headerMeta: coStream.headerMeta,
            group: coStream.group,
        }

        this.perSession = coStream.sessions().map((sessionID) => {
            const items = [...coStream.itemsIn(sessionID)].map((item) =>
                autoSubContext.defineResolvedRefPropertiesIn(
                    {
                        tx: item.tx,
                        at: new Date(item.at),
                    },
                    {
                        by: {
                            value: cojsonInternals.isAccountID(item.by)
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
                } satisfies ResolvedCoStreamEntry<S["_item"]>,
            ];
        });

        this.perAccount = [...coStream.accounts()].map((accountID) => {
            const items = [...coStream.itemsBy(accountID)].map((item) =>
                autoSubContext.defineResolvedRefPropertiesIn(
                    {
                        tx: item.tx,
                        at: new Date(item.at),
                    },
                    {
                        by: {
                            value: cojsonInternals.isAccountID(item.by)
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
            } satisfies ResolvedCoStreamEntry<S["_item"]>;

            if (accountID === autoSubContext.node.account.id) {
                this.me = entry;
            }

            return [accountID, entry];
        });
    }

    push(item: S["_item"], privacy?: "private" | "trusting"): S {
        return this.meta.coValue.push(item, privacy);
    }
    mutate(
        mutator: (mutable: MutableCoStream<S["_item"], S["headerMeta"]>) => void
    ): S {
        return this.meta.coValue.mutate(mutator);
    }
}
