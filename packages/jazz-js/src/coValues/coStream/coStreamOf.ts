import { BinaryStreamInfo } from "cojson";
import { CoValueSchema, ID } from "../../coValueInterfaces.js";
import { Account } from "../account/account.js";
import { Group } from "../group/group.js";
import {
    BinaryCoStream,
    BinaryCoStreamSchema,
    CoStreamSchema,
} from "./coStream.js";

function CoStreamOfHelper<Self, Item>(itemSchema: Item) {
    class CoStreamOfItem {}

    return CoStreamOfItem as CoStreamSchema<Self, Item>;
}

export function CoStreamOf<Self>() {
    return function <Item>(itemSchema: Item) {
        return CoStreamOfHelper<Self, Item>(itemSchema);
    };
}

class BinaryCoStreamImplClass implements BinaryCoStream {
    constructor(
        init: [] | undefined,
        options: {
            owner: Account | Group;
        }
    ) {}

    static load(
        id: ID<BinaryCoStreamImplClass>,
        options: { as: Account; onProgress?: (progress: number) => void }
    ): Promise<BinaryCoStreamImplClass | "unavailable"> {}

    getChunks(options?: {
        allowUnfinished?: boolean;
    }): BinaryStreamInfo & { chunks: Uint8Array[]; finished: boolean } {}

    start(options: BinaryStreamInfo): void {}

    push(data: Uint8Array): void {}

    end(): void {}
}

export const BinaryCoStreamImpl =
    BinaryCoStreamImplClass satisfies BinaryCoStreamSchema;
