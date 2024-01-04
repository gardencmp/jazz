import {
    CoStream as RawCoStream,
    BinaryCoStream as RawBinaryCoStream,
    Account as RawAccount,
} from "cojson";
import { ControlledAccount } from "./account.js";
import {
    Account,
    CoValue,
    CoValueBase,
    CoValueSchemaBase,
    Group,
    ID,
    RawType,
    SimpleAccount,
} from "./index.js";
import { Schema } from "./schema.js";

export interface CoStream<Item extends Schema = Schema> extends CoValueBase {
    id: ID<CoStream<Item>>;
    meta: CoStreamMeta;
    _raw: RawCoStream<RawType<Item>>;
}

class CoStreamMeta {
    owner: Account | Group;

    constructor(raw: RawCoStream) {
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = Group.fromRaw(rawOwner);
        }
    }
}

export interface CoStreamSchema<Item extends Schema = Schema>
    extends Schema<CoStream<Item>>,
        CoValueSchemaBase<CoStream<Item>, RawCoStream<RawType<Item>>> {
    _Type: "costream";
    _Item: Item;

    new (options: { owner: Account | Group }): CoStream<Item>;
    new (options: { fromRaw: RawType<CoStreamSchema<Item>> }): CoStream<Item>;

    fromRaw(
        raw: RawCoStream<RawType<Item>>,
        onGetRef?: (id: ID<CoValue>) => void
    ): CoStream<Item>;

    load(
        id: ID<CoStream<Item>>,
        { as }: { as: ControlledAccount }
    ): Promise<CoStream<Item>>;
}

export function isCoStreamSchema(value: unknown): value is CoStreamSchema {
    return (
        typeof value === "object" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "costream"
    );
}

export function isCoStream(value: unknown): value is CoStream {
    return typeof value === "object" &&
    value !== null && isCoStreamSchema(value.constructor) && "id" in value;
}

export interface BinaryCoStream extends CoValueBase {
    id: ID<BinaryCoStream>;
    meta: CoStreamMeta;
    _raw: RawBinaryCoStream;

    start(options: {
        mimeType?: string;
        totalSizeBytes?: number;
        fileName?: string;
    }): void;
    push(data: ArrayBuffer | ArrayBufferView): void;
    end(): void;

    getChunks(options?: { allowUnfinished?: boolean }): {
        chunks: Uint8Array[];
        mimeType?: string;
    };
}

class BinaryCoStreamMeta {
    owner: Account | Group;

    constructor(raw: RawBinaryCoStream) {
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = Group.fromRaw(rawOwner);
        }
    }
}

export interface BinaryCoStreamSchema<Item extends Schema = Schema>
    extends Schema<BinaryCoStream>,
        CoValueSchemaBase<BinaryCoStream, RawBinaryCoStream> {
    _Type: "binarycostream";

    new (options: { owner: Account | Group }): BinaryCoStream;

    fromRaw(
        raw: RawBinaryCoStream,
        onGetRef?: (id: ID<CoValue>) => void
    ): BinaryCoStream;

    load(
        id: ID<BinaryCoStream>,
        {
            as,
            onProgress,
        }: { as: ControlledAccount; onProgress?: (progress: number) => void }
    ): Promise<BinaryCoStream | undefined>;
}

export const BinaryCoStream = class BinaryCoStream implements BinaryCoStream {
    static _Type = "binarycostream" as const;
    static _Value: BinaryCoStream =
        "BinaryCoStream" as unknown as BinaryCoStream;
    static _RawValue: RawBinaryCoStream;
    id: ID<BinaryCoStream>;
    meta: BinaryCoStreamMeta;
    _raw: RawBinaryCoStream;

    constructor(
        options: { owner: Account | Group } | { fromRaw: RawBinaryCoStream }
    ) {
        let raw: RawBinaryCoStream;
        if ("fromRaw" in options) {
            raw = options.fromRaw;
        } else if (options.owner) {
            const rawOwner = options.owner._raw;
            raw = rawOwner.createBinaryStream();
        } else {
            throw new Error("Invalid options");
        }

        this._raw = raw;
        this.id = raw.id as unknown as ID<BinaryCoStream>;
        this.meta = new BinaryCoStreamMeta(raw);
    }

    static fromRaw(
        raw: RawBinaryCoStream,
        onGetRef?: (id: ID<CoValue>) => void
    ): BinaryCoStream {
        throw new Error("Method not implemented.");
    }

    static load(
        id: ID<BinaryCoStream>,
        {
            as,
            onProgress,
        }: { as: ControlledAccount; onProgress?: (progress: number) => void }
    ): Promise<BinaryCoStream | undefined> {
        throw new Error("Method not implemented.");
    }

    start(options: {
        mimeType?: string;
        totalSizeBytes?: number;
        fileName?: string;
    }) {
        throw new Error("Method not implemented.");
    }

    push(data: ArrayBuffer | ArrayBufferView) {
        throw new Error("Method not implemented.");
    }

    end() {
        throw new Error("Method not implemented.");
    }

    getChunks(options?: { allowUnfinished?: boolean }): {
        chunks: Uint8Array[];
        mimeType?: string;
    } {
        throw new Error("Method not implemented.");
    }
} satisfies BinaryCoStreamSchema;

export function isBinaryCoStreamSchema(
    value: unknown
): value is BinaryCoStreamSchema {
    return (
        typeof value === "object" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "binarycostream"
    );
}

export function isBinaryCoStream(value: unknown): value is BinaryCoStream {
    return typeof value === "object" &&
    value !== null && isBinaryCoStreamSchema(value.constructor) && "id" in value;
}