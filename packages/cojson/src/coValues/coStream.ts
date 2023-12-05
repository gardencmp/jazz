import { JsonObject, JsonValue } from "../jsonValue.js";
import { CoValue, CoID } from "../coValue.js";
import { isAccountID } from "../typeUtils/isAccountID.js";
import { isCoValue } from "../typeUtils/isCoValue.js";
import { CoValueCore } from "../coValueCore.js";
import { accountOrAgentIDfromSessionID } from "../typeUtils/accountOrAgentIDfromSessionID.js";
import { Group } from "./group.js";
import { AgentID, SessionID, TransactionID } from "../ids.js";
import { base64URLtoBytes, bytesToBase64url } from "../base64url.js";
import { AccountID } from "./account.js";

export type BinaryStreamInfo = {
    mimeType: string;
    fileName?: string;
    totalSizeBytes?: number;
};

export type BinaryStreamStart = {
    type: "start";
} & BinaryStreamInfo;

export type BinaryStreamChunk = {
    type: "chunk";
    chunk: `binary_U${string}`;
};

export type BinaryStreamEnd = {
    type: "end";
};

export type BinaryCoStreamMeta = JsonObject & { type: "binary" };

export type BinaryStreamItem =
    | BinaryStreamStart
    | BinaryStreamChunk
    | BinaryStreamEnd;

export type CoStreamItem<Item extends JsonValue> = {
    value: Item;
    tx: TransactionID;
    madeAt: number;
};

export class CoStreamView<
    Item extends JsonValue = JsonValue,
    Meta extends JsonObject | null = JsonObject | null
> implements CoValue
{
    id: CoID<this>;
    type = "costream" as const;
    core: CoValueCore;
    items: {
        [key: SessionID]: CoStreamItem<Item>[];
    };
    readonly _item!: Item;

    constructor(core: CoValueCore) {
        this.id = core.id as CoID<this>;
        this.core = core;
        this.items = {};
        this.fillFromCoValue();
    }

    get headerMeta(): Meta {
        return this.core.header.meta as Meta;
    }

    get group(): Group {
        return this.core.getGroup();
    }

    /** Not yet implemented */
    atTime(_time: number): this {
        throw new Error("Not yet implemented");
    }

    /** @internal */
    protected fillFromCoValue() {
        this.items = {};

        for (const {
            txID,
            madeAt,
            changes,
        } of this.core.getValidSortedTransactions()) {
            for (const changeUntyped of changes) {
                const change = changeUntyped as Item;
                let entries = this.items[txID.sessionID];
                if (!entries) {
                    entries = [];
                    this.items[txID.sessionID] = entries;
                }
                entries.push({ value: change, madeAt, tx: txID });
            }
        }
    }

    getSingleStream(): Item[] | undefined {
        if (Object.keys(this.items).length === 0) {
            return undefined;
        } else if (Object.keys(this.items).length !== 1) {
            throw new Error(
                "CoStream.getSingleStream() can only be called when there is exactly one stream"
            );
        }

        return Object.values(this.items)[0]?.map((item) => item.value);
    }

    sessions(): SessionID[] {
        return Object.keys(this.items) as SessionID[];
    }

    accounts(): Set<AccountID> {
        return new Set(
            this.sessions()
                .map(accountOrAgentIDfromSessionID)
                .filter(isAccountID)
        );
    }

    nthItemIn(
        sessionID: SessionID,
        n: number
    ):
        | {
              by: AccountID | AgentID;
              tx: TransactionID;
              at: Date;
              value: Item;
          }
        | undefined {
        const items = this.items[sessionID];
        if (!items) return;

        const item = items[n];
        if (!item) return;

        return {
            by: accountOrAgentIDfromSessionID(sessionID),
            tx: item.tx,
            at: new Date(item.madeAt),
            value: item.value,
        };
    }

    lastItemIn(sessionID: SessionID):
        | {
              by: AccountID | AgentID;
              tx: TransactionID;
              at: Date;
              value: Item;
          }
        | undefined {
        const items = this.items[sessionID];
        if (!items) return;
        return this.nthItemIn(sessionID, items.length - 1);
    }

    *itemsIn(sessionID: SessionID) {
        const items = this.items[sessionID];
        if (!items) return;
        for (const item of items) {
            yield {
                by: accountOrAgentIDfromSessionID(sessionID),
                tx: item.tx,
                at: new Date(item.madeAt),
                value: item.value as Item,
            };
        }
    }

    lastItemBy(account: AccountID | AgentID):
        | {
              by: AccountID | AgentID;
              tx: TransactionID;
              at: Date;
              value: Item;
          }
        | undefined {
        let latestItem:
            | {
                  by: AccountID | AgentID;
                  tx: TransactionID;
                  at: Date;
                  value: Item;
              }
            | undefined;

        for (const sessionID of Object.keys(this.items)) {
            if (sessionID.startsWith(account)) {
                const item = this.lastItemIn(sessionID as SessionID);
                if (!item) continue;
                if (!latestItem || item.at > latestItem.at) {
                    latestItem = {
                        by: item.by,
                        tx: item.tx,
                        at: item.at,
                        value: item.value,
                    };
                }
            }
        }

        return latestItem;
    }

    *itemsBy(account: AccountID | AgentID) {
        // TODO: this can be made more lazy without a huge collect and sort
        const items = [
            ...Object.keys(this.items).flatMap((sessionID) =>
                sessionID.startsWith(account)
                    ? [...this.itemsIn(sessionID as SessionID)].map((item) => ({
                          in: sessionID as SessionID,
                          ...item,
                      }))
                    : []
            ),
        ];

        items.sort((a, b) => a.at.getTime() - b.at.getTime());

        for (const item of items) {
            yield item;
        }
    }

    toJSON(): {
        [key: SessionID]: Item[];
    } {
        return Object.fromEntries(
            Object.entries(this.items).map(([sessionID, items]) => [
                sessionID,
                items.map((item) => item.value),
            ])
        );
    }

    subscribe(listener: (coStream: this) => void): () => void {
        return this.core.subscribe((content) => {
            listener(content as this);
        });
    }
}

export class CoStream<
        Item extends JsonValue = JsonValue,
        Meta extends JsonObject | null = JsonObject | null
    >
    extends CoStreamView<Item, Meta>
    implements CoValue
{
    push(item: Item, privacy: "private" | "trusting" = "private"): void {
        this.core.makeTransaction([isCoValue(item) ? item.id : item], privacy);
        this.fillFromCoValue();
    }
}

const binary_U_prefixLength = 8; // "binary_U".length;

export class BinaryCoStreamView<
        Meta extends BinaryCoStreamMeta = { type: "binary" }
    >
    extends CoStreamView<BinaryStreamItem, Meta>
    implements CoValue
{
    getBinaryChunks(
        allowUnfinished?: boolean
    ):
        | (BinaryStreamInfo & { chunks: Uint8Array[]; finished: boolean })
        | undefined {
        // const before = performance.now();
        const items = this.getSingleStream();

        if (!items) return;

        const start = items[0];

        if (start?.type !== "start") {
            console.error("Invalid binary stream start", start);
            return;
        }

        const end = items[items.length - 1];

        if (end?.type !== "end" && !allowUnfinished) return;

        const chunks: Uint8Array[] = [];

        let finished = false;
        // let totalLength = 0;

        let lastProgressUpdate = Date.now();

        for (const item of items.slice(1)) {
            if (item.type === "end") {
                finished = true;
                break;
            }

            if (item.type !== "chunk") {
                console.error("Invalid binary stream chunk", item);
                return undefined;
            }

            const chunk = base64URLtoBytes(
                item.chunk.slice(binary_U_prefixLength)
            );
            // totalLength += chunk.length;
            chunks.push(chunk);

            if (Date.now() - lastProgressUpdate > 100) {
                lastProgressUpdate = Date.now();
            }
        }

        // const after = performance.now();
        // console.log(
        //     "getBinaryChunks bandwidth in MB/s",
        //     (1000 * totalLength) / (after - before) / (1024 * 1024)
        // );

        return {
            mimeType: start.mimeType,
            fileName: start.fileName,
            totalSizeBytes: start.totalSizeBytes,
            chunks,
            finished,
        };
    }
}

export class BinaryCoStream<
        Meta extends BinaryCoStreamMeta = { type: "binary" }
    >
    extends BinaryCoStreamView<Meta>
    implements CoValue
{
    /** @internal */
    push(
        item: BinaryStreamItem,
        privacy: "private" | "trusting" = "private",
        updateView: boolean = true
    ): void {
        this.core.makeTransaction([item], privacy);
        if (updateView) {
            this.fillFromCoValue();
        }
    }

    startBinaryStream(
        settings: BinaryStreamInfo,
        privacy: "private" | "trusting" = "private"
    ): void {
        this.push(
            {
                type: "start",
                ...settings,
            } satisfies BinaryStreamStart,
            privacy,
            false
        );
    }

    pushBinaryStreamChunk(
        chunk: Uint8Array,
        privacy: "private" | "trusting" = "private"
    ): void {
        // const before = performance.now();
        this.push(
            {
                type: "chunk",
                chunk: `binary_U${bytesToBase64url(chunk)}`,
            } satisfies BinaryStreamChunk,
            privacy,
            false
        );
        // const after = performance.now();
        // console.log(
        //     "pushBinaryStreamChunk bandwidth in MB/s",
        //     (1000 * chunk.length) / (after - before) / (1024 * 1024)
        // );
    }

    endBinaryStream(privacy: "private" | "trusting" = "private") {
        this.push(
            {
                type: "end",
            } satisfies BinaryStreamEnd,
            privacy,
            true
        );
    }
}
