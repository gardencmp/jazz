import { Effect } from "effect";
import { CoValueChunk } from "./index.js";
import { RawCoID } from "../ids.js";
import { CryptoProvider, StreamingHash } from "../crypto/crypto.js";

export type BlockFilename = `${string}-L${number}-H${number}.jsonl`;

export type BlockHeader = { id: RawCoID; start: number; length: number }[];

export type WalEntry = { id: RawCoID } & CoValueChunk;

export type WalFilename = `wal-${number}.jsonl`;

export type FSErr = {
    type: "fileSystemError";
    error: Error;
};

export interface FileSystem<WriteHandle, ReadHandle> {
    crypto: CryptoProvider;
    createFile(filename: string): Effect.Effect<WriteHandle, FSErr>;
    append(handle: WriteHandle, data: Uint8Array): Effect.Effect<void, FSErr>;
    close(handle: ReadHandle | WriteHandle): Effect.Effect<void, FSErr>;
    closeAndRename(
        handle: WriteHandle,
        filename: BlockFilename,
    ): Effect.Effect<void, FSErr>;
    openToRead(
        filename: string,
    ): Effect.Effect<{ handle: ReadHandle; size: number }, FSErr>;
    read(
        handle: ReadHandle,
        offset: number,
        length: number,
    ): Effect.Effect<Uint8Array, FSErr>;
    listFiles(): Effect.Effect<string[], FSErr>;
    removeFile(
        filename: BlockFilename | WalFilename,
    ): Effect.Effect<void, FSErr>;
}

export const textEncoder = new TextEncoder();
export const textDecoder = new TextDecoder();

export function readChunk<RH, FS extends FileSystem<unknown, RH>>(
    handle: RH,
    header: { start: number; length: number },
    fs: FS,
): Effect.Effect<CoValueChunk, FSErr> {
    return Effect.gen(function* ($) {
        const chunkBytes = yield* $(
            fs.read(handle, header.start, header.length),
        );

        const chunk = JSON.parse(textDecoder.decode(chunkBytes));
        return chunk;
    });
}

export function readHeader<RH, FS extends FileSystem<unknown, RH>>(
    filename: string,
    handle: RH,
    size: number,
    fs: FS,
): Effect.Effect<BlockHeader, FSErr> {
    return Effect.gen(function* ($) {
        const headerLength = Number(filename.match(/-H(\d+)\.jsonl$/)![1]!);

        const headerBytes = yield* $(
            fs.read(handle, size - headerLength, headerLength),
        );

        const header = JSON.parse(textDecoder.decode(headerBytes));
        return header;
    });
}

export function writeBlock<WH, RH, FS extends FileSystem<WH, RH>>(
    chunks: Map<RawCoID, CoValueChunk>,
    level: number,
    fs: FS,
): Effect.Effect<void, FSErr> {
    if (chunks.size === 0) {
        return Effect.die(new Error("No chunks to write"));
    }

    return Effect.gen(function* ($) {
        const blockHeader: BlockHeader = [];

        let offset = 0;

        const file = yield* $(
            fs.createFile(
                "wipBlock" +
                    Math.random().toString(36).substring(7) +
                    ".tmp.jsonl",
            ),
        );
        const hash = new StreamingHash(fs.crypto);

        const chunksSortedById = Array.from(chunks).sort(([id1], [id2]) =>
            id1.localeCompare(id2),
        );

        for (const [id, chunk] of chunksSortedById) {
            const encodedBytes = hash.update(chunk);
            const encodedBytesWithNewline = new Uint8Array(
                encodedBytes.length + 1,
            );
            encodedBytesWithNewline.set(encodedBytes);
            encodedBytesWithNewline[encodedBytes.length] = 10;
            yield* $(fs.append(file, encodedBytesWithNewline));
            const length = encodedBytesWithNewline.length;
            blockHeader.push({ id, start: offset, length });
            offset += length;
        }

        const headerBytes = textEncoder.encode(JSON.stringify(blockHeader));
        yield* $(fs.append(file, headerBytes));

        // console.log(
        //     "full file",
        //     yield* $(
        //         fs.read(file as unknown as RH, 0, offset + headerBytes.length),
        //     ),
        // );

        const filename: BlockFilename = `${hash.digest()}-L${level}-H${
            headerBytes.length
        }.jsonl`;
        // console.log("renaming to" + filename);
        yield* $(fs.closeAndRename(file, filename));

        // console.log("Wrote block", filename, blockHeader);
        // console.log("IDs in block", blockHeader.map(e => e.id));
    });
}

export function writeToWal<WH, RH, FS extends FileSystem<WH, RH>>(
    handle: WH,
    fs: FS,
    id: RawCoID,
    chunk: CoValueChunk,
): Effect.Effect<void, FSErr> {
    return Effect.gen(function* ($) {
        const walEntry: WalEntry = {
            id,
            ...chunk,
        };
        const bytes = textEncoder.encode(JSON.stringify(walEntry) + "\n");
        yield* $(fs.append(handle, bytes));
    });
}
