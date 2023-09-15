import { JsonObject, JsonValue } from "../jsonValue.js";
import { CoValue, CoID, isCoValue } from "../coValue.js";
import { CoValueCore, accountOrAgentIDfromSessionID } from "../coValueCore.js";
import { Group } from "../group.js";
import { SessionID } from "../ids.js";
import { base64URLtoBytes, bytesToBase64url } from "../base64url.js";
import { AccountID, isAccountID } from "../account.js";
import { parseJSON } from "../jsonStringify.js";

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

export type CoStreamItem<T extends JsonValue | CoValue> = {
    item: T extends CoValue ? CoID<T> : Exclude<T, CoValue>;
    madeAt: number;
};

export class CoStream<
    T extends JsonValue | CoValue,
    Meta extends JsonObject | null = null
> implements CoValue
{
    id: CoID<this>;
    type = "costream" as const;
    core: CoValueCore;
    items: {
        [key: SessionID]: CoStreamItem<T>[];
    };

    constructor(core: CoValueCore) {
        this.id = core.id as CoID<this>;
        this.core = core;
        this.items = {};
        this.fillFromCoValue();
    }

    get meta(): Meta {
        return this.core.header.meta as Meta;
    }

    get group(): Group {
        return this.core.getGroup();
    }

    /** @internal */
    protected fillFromCoValue() {
        this.items = {};

        for (const {
            txID,
            madeAt,
            changes,
        } of this.core.getValidSortedTransactions()) {
            for (const changeUntyped of parseJSON(changes)) {
                const change = changeUntyped as T extends CoValue
                    ? CoID<T>
                    : Exclude<T, CoValue>;
                let entries = this.items[txID.sessionID];
                if (!entries) {
                    entries = [];
                    this.items[txID.sessionID] = entries;
                }
                entries.push({ item: change, madeAt });
            }
        }
    }

    getSingleStream():
        | (T extends CoValue ? CoID<T> : Exclude<T, CoValue>)[]
        | undefined {
        if (Object.keys(this.items).length === 0) {
            return undefined;
        } else if (Object.keys(this.items).length !== 1) {
            throw new Error(
                "CoStream.getSingleStream() can only be called when there is exactly one stream"
            );
        }

        return Object.values(this.items)[0]?.map((item) => item.item);
    }

    getLastItemsPerAccount(): {
        [account: AccountID]:
            | (T extends CoValue ? CoID<T> : Exclude<T, CoValue>)
            | undefined;
    } {
        const result: { [account: AccountID]: CoStreamItem<T> | undefined } =
            {};

        for (const [sessionID, items] of Object.entries(this.items)) {
            const account = accountOrAgentIDfromSessionID(
                sessionID as SessionID
            );
            if (!isAccountID(account)) continue;
            if (items.length > 0) {
                const lastItemOfSession = items[items.length - 1]!;
                if (
                    !result[account] ||
                    lastItemOfSession.madeAt > result[account]!.madeAt
                ) {
                    result[account] = lastItemOfSession;
                }
            }
        }

        return Object.fromEntries(
            Object.entries(result).map(([account, item]) => [
                account,
                item?.item,
            ])
        );
    }

    getLastItemFrom(
        account: AccountID
    ): (T extends CoValue ? CoID<T> : Exclude<T, CoValue>) | undefined {
        let lastItem: CoStreamItem<T> | undefined;

        for (const [sessionID, items] of Object.entries(this.items)) {
            if (sessionID.startsWith(account)) {
                if (items.length > 0) {
                    const lastItemOfSession = items[items.length - 1]!;
                    if (
                        !lastItem ||
                        lastItemOfSession.madeAt > lastItem.madeAt
                    ) {
                        lastItem = lastItemOfSession;
                    }
                }
            }
        }

        return lastItem?.item;
    }

    getLastItemFromMe():
        | (T extends CoValue ? CoID<T> : Exclude<T, CoValue>)
        | undefined {
        const myAccountID = this.core.node.account.id;
        if (!isAccountID(myAccountID)) return undefined;
        return this.getLastItemFrom(myAccountID);
    }

    toJSON(): {
        [key: SessionID]: (T extends CoValue ? CoID<T> : Exclude<T, CoValue>)[];
    } {
        return Object.fromEntries(
            Object.entries(this.items).map(([sessionID, items]) => [
                sessionID,
                items.map((item) => item.item),
            ])
        );
    }

    subscribe(listener: (coStream: this) => void): () => void {
        return this.core.subscribe((content) => {
            listener(content as this);
        });
    }

    edit(changer: (editable: WriteableCoStream<T, Meta>) => void): this {
        const editable = new WriteableCoStream<T, Meta>(this.core);
        changer(editable);
        return new CoStream(this.core) as this;
    }
}

const binary_U_prefixLength = 8; // "binary_U".length;

export class BinaryCoStream<
        Meta extends BinaryCoStreamMeta = { type: "binary" }
    >
    extends CoStream<BinaryStreamItem, Meta>
    implements CoValue
{
    id!: CoID<this>;

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

    edit(changer: (editable: WriteableBinaryCoStream<Meta>) => void): this {
        const editable = new WriteableBinaryCoStream<Meta>(this.core);
        changer(editable);
        return new BinaryCoStream(this.core) as this;
    }
}

export class WriteableCoStream<
        T extends JsonValue | CoValue,
        Meta extends JsonObject | null = null
    >
    extends CoStream<T, Meta>
    implements CoValue
{
    /** @internal */
    edit(_changer: (editable: WriteableCoStream<T, Meta>) => void): this {
        throw new Error("Already editing.");
    }

    push(
        item: T extends CoValue ? T | CoID<T> : T,
        privacy: "private" | "trusting" = "private"
    ) {
        this.core.makeTransaction(
            [isCoValue(item) ? item.id : item],
            privacy
        );
        this.fillFromCoValue();
    }
}

export class WriteableBinaryCoStream<
        Meta extends BinaryCoStreamMeta = { type: "binary" }
    >
    extends BinaryCoStream<Meta>
    implements CoValue
{
    /** @internal */
    edit(_changer: (editable: WriteableBinaryCoStream<Meta>) => void): this {
        throw new Error("Already editing.");
    }

    /** @internal */
    push(item: BinaryStreamItem, privacy: "private" | "trusting" = "private") {
        WriteableCoStream.prototype.push.call(this, item, privacy);
    }

    startBinaryStream(
        settings: BinaryStreamInfo,
        privacy: "private" | "trusting" = "private"
    ) {
        this.push(
            {
                type: "start",
                ...settings,
            } satisfies BinaryStreamStart,
            privacy
        );
    }

    pushBinaryStreamChunk(
        chunk: Uint8Array,
        privacy: "private" | "trusting" = "private"
    ) {
        // const before = performance.now();
        this.push(
            {
                type: "chunk",
                chunk: `binary_U${bytesToBase64url(chunk)}`,
            } satisfies BinaryStreamChunk,
            privacy
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
            privacy
        );
    }
}
