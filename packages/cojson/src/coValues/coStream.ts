import { JsonObject, JsonValue } from "../jsonValue.js";
import { CoID, ReadableCoValue, WriteableCoValue } from "../coValue.js";
import { CoValueCore } from "../coValueCore.js";
import { Group } from "../group.js";
import { SessionID } from "../ids.js";
import { base64url } from "@scure/base";

export type BinaryChunkInfo = {
    mimeType: string;
    fileName?: string;
    totalSizeBytes?: number;
};

export type BinaryStreamStart = {
    type: "start";
} & BinaryChunkInfo;

export type BinaryStreamChunk = {
    type: "chunk";
    chunk: `U${string}`;
};

export type BinaryStreamEnd = {
    type: "end";
};

export type BinaryCoStreamMeta = JsonObject & { type: "binary" };

export type BinaryStreamItem =
    | BinaryStreamStart
    | BinaryStreamChunk
    | BinaryStreamEnd;

export class CoStream<
    T extends JsonValue,
    Meta extends JsonObject | null = null
> implements ReadableCoValue
{
    id: CoID<CoStream<T, Meta>>;
    type = "costream" as const;
    core: CoValueCore;
    items: {
        [key: SessionID]: T[];
    };

    constructor(core: CoValueCore) {
        this.id = core.id as CoID<CoStream<T, Meta>>;
        this.core = core;
        this.items = {};
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
            changes,
        } of this.core.getValidSortedTransactions()) {
            for (const changeUntyped of changes) {
                const change = changeUntyped as T;
                let entries = this.items[txID.sessionID];
                if (!entries) {
                    entries = [];
                    this.items[txID.sessionID] = entries;
                }
                entries.push(change);
            }
        }
    }

    getSingleStream(): T[] | undefined {
        if (Object.keys(this.items).length === 0) {
            return undefined;
        } else if (Object.keys(this.items).length !== 1) {
            throw new Error(
                "CoStream.getSingleStream() can only be called when there is exactly one stream"
            );
        }

        return Object.values(this.items)[0];
    }

    toJSON(): {
        [key: SessionID]: T[];
    } {
        return this.items;
    }

    subscribe(listener: (coMap: CoStream<T, Meta>) => void): () => void {
        return this.core.subscribe((content) => {
            listener(content as CoStream<T, Meta>);
        });
    }

    edit(
        changer: (editable: WriteableCoStream<T, Meta>) => void
    ): CoStream<T, Meta> {
        const editable = new WriteableCoStream<T, Meta>(this.core);
        changer(editable);
        return new CoStream(this.core);
    }
}

export class BinaryCoStream<
        Meta extends BinaryCoStreamMeta = { type: "binary" }
    >
    extends CoStream<BinaryStreamItem, Meta>
    implements ReadableCoValue
{
    id!: CoID<BinaryCoStream<Meta>>;

    getBinaryChunks():
        | (BinaryChunkInfo & { chunks: Uint8Array[]; finished: boolean })
        | undefined {
        const items = this.getSingleStream();

        if (!items) return;

        const start = items[0];

        if (start?.type !== "start") {
            console.error("Invalid binary stream start", start);
            return;
        }

        const chunks: Uint8Array[] = [];

        for (const item of items.slice(1)) {
            if (item.type === "end") {
                return {
                    mimeType: start.mimeType,
                    fileName: start.fileName,
                    totalSizeBytes: start.totalSizeBytes,
                    chunks,
                    finished: true,
                };
            }

            if (item.type !== "chunk") {
                console.error("Invalid binary stream chunk", item);
                return undefined;
            }

            chunks.push(base64url.decode(item.chunk.slice(1)));
        }

        return {
            mimeType: start.mimeType,
            fileName: start.fileName,
            totalSizeBytes: start.totalSizeBytes,
            chunks,
            finished: false,
        };
    }

    edit(
        changer: (editable: WriteableBinaryCoStream<Meta>) => void
    ): BinaryCoStream<Meta> {
        const editable = new WriteableBinaryCoStream<Meta>(this.core);
        changer(editable);
        return new BinaryCoStream(this.core);
    }
}

export class WriteableCoStream<
        T extends JsonValue,
        Meta extends JsonObject | null = null
    >
    extends CoStream<T, Meta>
    implements WriteableCoValue
{
    /** @internal */
    edit(
        _changer: (editable: WriteableCoStream<T, Meta>) => void
    ): CoStream<T, Meta> {
        throw new Error("Already editing.");
    }

    push(item: T, privacy: "private" | "trusting" = "private") {
        this.core.makeTransaction([item], privacy);
        this.fillFromCoValue();
    }
}

export class WriteableBinaryCoStream<
        Meta extends BinaryCoStreamMeta = { type: "binary" }
    >
    extends BinaryCoStream<Meta>
    implements WriteableCoValue
{
    /** @internal */
    edit(
        _changer: (editable: WriteableBinaryCoStream<Meta>) => void
    ): BinaryCoStream<Meta> {
        throw new Error("Already editing.");
    }

    /** @internal */
    push(
        item: BinaryStreamItem,
        privacy: "private" | "trusting" = "private"
    ) {
        WriteableCoStream.prototype.push.call(this, item, privacy);
    }

    startBinaryStream(
        settings: BinaryChunkInfo,
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
        this.push(
            {
                type: "chunk",
                chunk: `U${base64url.encode(chunk)}`,
            } satisfies BinaryStreamChunk,
            privacy
        );
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
