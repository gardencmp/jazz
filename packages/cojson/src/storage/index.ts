
import {
    ReadableStream,
    WritableStream,
    ReadableStreamDefaultReader,
    WritableStreamDefaultWriter,
} from "isomorphic-streams";
import { Effect, Either, SynchronizedRef } from "effect";
import { RawCoID, SessionID } from '../ids.js';
import { CoValueHeader, MAX_RECOMMENDED_TX_SIZE, Transaction } from '../coValueCore.js';
import { Signature, StreamingHash } from '../crypto.js';
import { CoValueKnownState, NewContentMessage, Peer, SyncMessage } from "../sync.js";
import { CoID, RawCoValue } from "../index.js";
import { connectedPeers } from "../streamUtils.js";


export type BlockFilename =
    `${RawCoID}-${RawCoID}-${string}-L${number}-H${number}.jsonl`;

type CoValueChunk = {
    header?: CoValueHeader;
    sessionEntries: {
        [sessionID: string]: {
            after: number;
            lastSignature: Signature;
            transactions: Transaction[];
        }[];
    };
};

type BlockHeader = { id: RawCoID; start: number; length: number }[];

type WalEntry = { id: RawCoID } & CoValueChunk;

export type WalFilename = `wal-${number}.jsonl`;

export type FSErr = {
    type: "fileSystemError";
    error: Error;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export interface FileSystem<WriteHandle, ReadHandle> {
    createFile(filename: string): Effect.Effect<WriteHandle, FSErr>;
    append(handle: WriteHandle, data: Uint8Array): Effect.Effect<void, FSErr>;
    closeAndRename(
        handle: WriteHandle,
        filename: BlockFilename
    ): Effect.Effect<void, FSErr>;
    openToRead(
        filename: string
    ): Effect.Effect<{ handle: ReadHandle; size: number }, FSErr>;
    read(
        handle: ReadHandle,
        offset: number,
        length: number
    ): Effect.Effect<Uint8Array, FSErr>;
    listFiles(): Effect.Effect<string[], FSErr>;
    removeFile(filename: BlockFilename | WalFilename): Effect.Effect<void, FSErr>;
}

function writeBlock<WH, RH, FS extends FileSystem<WH, RH>>(
    chunks: Map<RawCoID, CoValueChunk>,
    level: number,
    fs: FS
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
                    ".tmp.jsonl"
            )
        );
        const hash = new StreamingHash();

        const chunksSortedById = Array.from(chunks).sort(([id1], [id2]) =>
            id1.localeCompare(id2)
        );

        for (const [id, chunk] of chunksSortedById) {
            const encodedBytes = hash.update(chunk);
            const encodedBytesWithNewline = new Uint8Array(
                encodedBytes.length + 1
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

        console.log(
            "full file",
            yield* $(
                fs.read(file as unknown as RH, 0, offset + headerBytes.length)
            )
        );

        const filename: BlockFilename = `${blockHeader[0]!.id}-${
            blockHeader[blockHeader.length - 1]!.id
        }-${hash.digest()}-L${level}-H${headerBytes.length}.jsonl`;
        yield* $(fs.closeAndRename(file, filename));

        console.log("Wrote block", filename, blockHeader);
        fileCache = undefined;
    });
}

function readHeader<RH, FS extends FileSystem<unknown, RH>>(
    filename: BlockFilename,
    fs: FS
): Effect.Effect<BlockHeader, FSErr> {
    return Effect.gen(function* ($) {
        const { handle, size } = yield* $(fs.openToRead(filename));

        const headerLength = Number(filename.match(/-H(\d+)\.jsonl$/)![1]!);

        const headerBytes = yield* $(
            fs.read(handle, size - headerLength, headerLength)
        );

        const header = JSON.parse(textDecoder.decode(headerBytes));
        return header;
    });
}

function readChunk<RH, FS extends FileSystem<unknown, RH>>(
    filename: BlockFilename,
    header: { start: number; length: number },
    fs: FS
): Effect.Effect<CoValueChunk, FSErr> {
    return Effect.gen(function* ($) {
        const { handle } = yield* $(fs.openToRead(filename));

        const chunkBytes = yield* $(
            fs.read(handle, header.start, header.length)
        );

        const chunk = JSON.parse(textDecoder.decode(chunkBytes));
        return chunk;
    });
}

function mergeChunks(
    chunkA: CoValueChunk,
    chunkB: CoValueChunk
): Either.Either<"nonContigous", CoValueChunk> {
    const header = chunkA.header || chunkB.header;

    const newSessions = { ...chunkA.sessionEntries };
    for (const sessionID in chunkB.sessionEntries) {
        // figure out if we can merge the chunks
        const sessionEntriesA = chunkA.sessionEntries[sessionID];
        const sessionEntriesB = chunkB.sessionEntries[sessionID]!;

        if (!sessionEntriesA) {
            newSessions[sessionID] = sessionEntriesB;
            continue;
        }

        const lastEntryOfA = sessionEntriesA[sessionEntriesA.length - 1]!;
        const firstEntryOfB = sessionEntriesB[0]!;

        if (
            lastEntryOfA.after + lastEntryOfA.transactions.length ===
            firstEntryOfB.after
        ) {
            const newEntries = [];
            let bytesSinceLastSignature = 0;
            for (const entry of sessionEntriesA.concat(sessionEntriesB)) {
                const entryByteLength = entry.transactions.reduce(
                    (sum, tx) =>
                        sum +
                        (tx.privacy === "private"
                            ? tx.encryptedChanges.length
                            : tx.changes.length),
                    0
                );
                if (
                    newEntries.length === 0 ||
                    bytesSinceLastSignature + entryByteLength >
                        MAX_RECOMMENDED_TX_SIZE
                ) {
                    newEntries.push({
                        after: entry.after,
                        lastSignature: entry.lastSignature,
                        transactions: entry.transactions,
                    });
                    bytesSinceLastSignature = 0;
                } else {
                    const lastNewEntry = newEntries[newEntries.length - 1]!;
                    lastNewEntry.transactions.push(...entry.transactions);

                    bytesSinceLastSignature += entry.transactions.length;
                }
            }
        } else {
            return Either.right("nonContigous" as const);
        }
    }

    return Either.left({ header, sessionEntries: newSessions });
}

function writeToWal<WH, RH, FS extends FileSystem<WH, RH>>(
    handle: WH,
    fs: FS,
    id: RawCoID,
    chunk: CoValueChunk
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

const headerCache = new Map<
    BlockFilename,
    { [id: RawCoID]: { start: number; length: number } }
>();

let fileCache: string[] | undefined;

function loadCoValue<WH, RH, FS extends FileSystem<WH, RH>>(
    id: RawCoID,
    fs: FS
): Effect.Effect<CoValueChunk | undefined, FSErr> {
    // return _loadChunkFromWal(id, fs);
    return Effect.gen(function* ($) {
        const files = fileCache || (yield* $(fs.listFiles()));
        fileCache = files;
        const blockFiles = files.filter((name) =>
            name.startsWith("co_")
        ) as BlockFilename[];

        for (const blockFile of blockFiles) {
            let cachedHeader = headerCache.get(blockFile);

            if (!cachedHeader) {
                cachedHeader = {};
                const header = yield* $(readHeader(blockFile, fs));
                for (const entry of header) {
                    cachedHeader[entry.id] = {
                        start: entry.start,
                        length: entry.length,
                    };
                }

                headerCache.set(blockFile, cachedHeader);
            }
            const headerEntry = cachedHeader[id];

            if (headerEntry) {
                return yield* $(readChunk(blockFile, headerEntry, fs));
            }
        }

        return undefined;
    });
}

function contentSinceChunk(
    id: RawCoID,
    chunk: CoValueChunk,
    known?: CoValueKnownState
): NewContentMessage[] {
    const newContentPieces: NewContentMessage[] = [];

    newContentPieces.push({
        id: id,
        action: "content",
        header: known?.header ? undefined : chunk.header,
        new: {},
    });

    for (const [sessionID, sessionsEntry] of Object.entries(
        chunk.sessionEntries
    )) {
        for (const entry of sessionsEntry) {
            const knownStart = known?.sessions[sessionID as SessionID] || 0;

            if (entry.after + entry.transactions.length <= knownStart) {
                continue;
            }

            const actuallyNewTransactions = entry.transactions.slice(
                Math.max(0, knownStart - entry.after)
            );

            const newAfter =
                entry.after +
                (actuallyNewTransactions.length - entry.transactions.length);

            let newContentEntry =
                newContentPieces[0]?.new[sessionID as SessionID];

            if (!newContentEntry) {
                newContentEntry = {
                    after: newAfter,
                    lastSignature: entry.lastSignature,
                    newTransactions: actuallyNewTransactions,
                };
                newContentPieces[0]!.new[sessionID as SessionID] =
                    newContentEntry;
            } else {
                newContentEntry.newTransactions.push(
                    ...actuallyNewTransactions
                );
                newContentEntry.lastSignature = entry.lastSignature;
            }
        }
    }

    return newContentPieces;
}

export class LSMStorage<WH, RH, FS extends FileSystem<WH, RH>> {
    fromLocalNode!: ReadableStreamDefaultReader<SyncMessage>;
    toLocalNode: WritableStreamDefaultWriter<SyncMessage>;
    fs: FS;
    currentWal: WH;
    coValues: SynchronizedRef.SynchronizedRef<{
        [id: RawCoID]: CoValueChunk | undefined;
    }>;

    constructor(
        fs: FS,
        currentWal: WH,
        fromLocalNode: ReadableStream<SyncMessage>,
        toLocalNode: WritableStream<SyncMessage>
    ) {
        this.fs = fs;
        this.fromLocalNode = fromLocalNode.getReader();
        this.toLocalNode = toLocalNode.getWriter();
        this.coValues = SynchronizedRef.unsafeMake({});
        this.currentWal = currentWal;

        void Effect.runPromise(
            Effect.gen(this, function* ($) {
                let done = false;
                while (!done) {
                    const result = yield* $(
                        Effect.promise(() => this.fromLocalNode.read())
                    );
                    done = result.done;

                    if (result.value) {
                        if (result.value.action === "done") {
                            continue;
                        }

                        if (result.value.action === "content") {
                            yield* $(this.handleNewContent(result.value));
                        } else {
                            yield* $(
                                this.sendNewContent(
                                    result.value.id,
                                    result.value,
                                    undefined
                                )
                            );
                        }
                    }
                }

                return;
            })
        );

        async function compact() {
            await Effect.runPromise(
                Effect.gen(function* ($) {
                    const fileNames = yield* $(fs.listFiles());

                    const walFiles = fileNames.filter((name) =>
                        name.startsWith("wal-")
                    ) as WalFilename[];
                    walFiles.sort();

                    const coValues = new Map<RawCoID, CoValueChunk>();

                    console.log("Compacting WAL files", walFiles);

                    for (const fileName of walFiles) {
                        const { handle, size } = yield* $(
                            fs.openToRead(fileName)
                        );
                        if (size === 0) continue;
                        const bytes = yield* $(fs.read(handle, 0, size));

                        const decoded = textDecoder.decode(bytes);
                        const lines = decoded.split("\n");

                        for (const line of lines) {
                            if (line.length === 0) continue;
                            const chunk = JSON.parse(line) as WalEntry;

                            const existingChunk = coValues.get(chunk.id);

                            if (existingChunk) {
                                const merged = mergeChunks(
                                    existingChunk,
                                    chunk
                                );
                                if (Either.isRight(merged)) {
                                    console.warn(
                                        "Non-contigous chunks in " +
                                            chunk.id +
                                            ", " +
                                            fileName,
                                            existingChunk,
                                            chunk
                                    );
                                } else {
                                    coValues.set(chunk.id, merged.left);
                                }
                            } else {
                                coValues.set(chunk.id, chunk);
                            }
                        }
                    }

                    yield* $(writeBlock(coValues, 0, fs));
                    for (const walFile of walFiles) {
                        yield* $(fs.removeFile(walFile));
                    }
                })
            );

            setTimeout(compact, 5000);
        }

        setTimeout(compact, 20000);
    }

    sendNewContent(
        id: RawCoID,
        known: CoValueKnownState | undefined,
        asDependencyOf: RawCoID | undefined
    ): Effect.Effect<void, FSErr> {
        return SynchronizedRef.updateEffect(this.coValues, (coValues) =>
            this.sendNewContentInner(coValues, id, known, asDependencyOf)
        );
    }

    private sendNewContentInner(
        coValues: { [id: `co_z${string}`]: CoValueChunk | undefined },
        id: RawCoID,
        known: CoValueKnownState | undefined,
        asDependencyOf: RawCoID | undefined
    ): Effect.Effect<
        { [id: `co_z${string}`]: CoValueChunk | undefined },
        FSErr,
        never
    > {
        return Effect.gen(this, function* () {
            let coValue = coValues[id];

            if (!coValue) {
                coValue = yield* loadCoValue(id, this.fs);
            }

            if (!coValue) {
                yield* Effect.promise(() =>
                    this.toLocalNode.write({
                        id: id,
                        action: "known",
                        header: false,
                        sessions: {},
                        asDependencyOf,
                    })
                );

                return coValues;
            }

            if (
                !known?.header &&
                coValue.header?.ruleset.type === "ownedByGroup"
            ) {
                coValues = yield* this.sendNewContentInner(
                    coValues,
                    coValue.header.ruleset.group,
                    undefined,
                    asDependencyOf || id
                );
            } else if (
                !known?.header &&
                coValue.header?.ruleset.type === "group"
            ) {
                const dependedOnAccounts = new Set();
                for (const session of Object.values(coValue.sessionEntries)) {
                    for (const entry of session) {
                        for (const tx of entry.transactions) {
                            if (tx.privacy === "trusting") {
                                const parsedChanges = JSON.parse(tx.changes);
                                for (const change of parsedChanges) {
                                    if (
                                        change.op === "set" &&
                                        change.key.startsWith("co_")
                                    ) {
                                        dependedOnAccounts.add(change.key);
                                    }
                                }
                            }
                        }
                    }
                }
                for (const account of dependedOnAccounts) {
                    coValues = yield* this.sendNewContentInner(
                        coValues,
                        account as CoID<RawCoValue>,
                        undefined,
                        asDependencyOf || id
                    );
                }
            }

            const newContentMessages = contentSinceChunk(
                id,
                coValue,
                known
            ).map((message) => ({ ...message, asDependencyOf }));

            const ourKnown: CoValueKnownState =
                chunkToKnownState(id, coValue);

            yield* Effect.promise(() =>
                this.toLocalNode.write({
                    action: "known",
                    ...ourKnown,
                    asDependencyOf,
                })
            );

            for (const message of newContentMessages) {
                if (Object.keys(message.new).length === 0) continue;
                yield* Effect.promise(() => this.toLocalNode.write(message));
            }

            return { ...coValues, [id]: coValue };
        });
    }

    handleNewContent(
        newContent: NewContentMessage
    ): Effect.Effect<void, FSErr> {
        return SynchronizedRef.updateEffect(this.coValues, (coValues) =>
            Effect.gen(this, function* () {
                const coValue = coValues[newContent.id];

                const newContentAsChunk: CoValueChunk = {
                    header: newContent.header,
                    sessionEntries: Object.fromEntries(
                        Object.entries(newContent.new).map(
                            ([sessionID, newInSession]) => [
                                sessionID,
                                [
                                    {
                                        after: newInSession.after,
                                        lastSignature:
                                            newInSession.lastSignature,
                                        transactions:
                                            newInSession.newTransactions,
                                    },
                                ],
                            ]
                        )
                    ),
                };

                if (!coValue) {
                    if (newContent.header) {
                        console.log("Creating in WAL", newContent.id);
                        yield* writeToWal(
                            this.currentWal,
                            this.fs,
                            newContent.id,
                            newContentAsChunk
                        );

                        return {
                            ...coValues,
                            [newContent.id]: newContentAsChunk,
                        };
                    } else {
                        // yield* $(
                        //     Effect.promise(() =>
                        //         this.toLocalNode.write({
                        //             action: "known",
                        //             id: newContent.id,
                        //             header: false,
                        //             sessions: {},
                        //             isCorrection: true,
                        //         })
                        //     )
                        // );
                        console.warn(
                            "Incontiguous incoming update for " + newContent.id
                        );
                        return coValues;
                    }
                } else {
                    const merged = mergeChunks(coValue, newContentAsChunk);
                    if (Either.isRight(merged)) {
                        yield* Effect.logWarning(
                            "Non-contigous new content for " + newContent.id
                        );

                        // yield* Effect.promise(() =>
                        //     this.toLocalNode.write({
                        //         action: "known",
                        //         ...chunkToKnownState(newContent.id, coValue),
                        //         isCorrection: true,
                        //     })
                        // );

                        return coValues;
                    } else {
                        console.log("Appending to WAL", newContent.id);
                        yield* writeToWal(
                            this.currentWal,
                            this.fs,
                            newContent.id,
                            newContentAsChunk
                        );

                        return { ...coValues, [newContent.id]: merged.left };
                    }
                }
            })
        );
    }

    static asPeer<WH, RH, FS extends FileSystem<WH, RH>>({
        fs,
        trace,
        localNodeName = "local",
    }: {
        fs: FS;
        trace?: boolean;
        localNodeName?: string;
    }): Promise<Peer> {
        return Effect.runPromise(
            Effect.gen(function* ($) {
                const [localNodeAsPeer, storageAsPeer] =
                    connectedPeers(localNodeName, "storage", {
                        peer1role: "client",
                        peer2role: "server",
                        trace,
                    });

                const currentWal = yield* $(
                    fs.createFile(
                        `wal-${new Date().toISOString()}-${Math.random()
                            .toString(36)
                            .slice(2)}.jsonl`
                    )
                );

                new LSMStorage(
                    fs,
                    currentWal,
                    localNodeAsPeer.incoming,
                    localNodeAsPeer.outgoing
                );

                return { ...storageAsPeer, priority: 200 };
            })
        );
    }
}

function chunkToKnownState(id: RawCoID, chunk: CoValueChunk) {
    const ourKnown: CoValueKnownState = {
        id,
        header: !!chunk.header,
        sessions: {},
    };

    for (const [sessionID, sessionEntries] of Object.entries(
        chunk.sessionEntries
    )) {
        for (const entry of sessionEntries) {
            ourKnown.sessions[sessionID as SessionID] =
                entry.after + entry.transactions.length;
        }
    }
    return ourKnown;
}
