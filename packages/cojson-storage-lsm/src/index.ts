import {
    cojsonInternals,
    SyncMessage,
    Peer,
    CojsonInternalTypes,
    SessionID,
    MAX_RECOMMENDED_TX_SIZE,
} from "cojson";
import { CoValueHeader } from "cojson/src/coValueCore";
import {
    ReadableStream,
    WritableStream,
    ReadableStreamDefaultReader,
    WritableStreamDefaultWriter,
} from "isomorphic-streams";
import { Effect, Either, Option, SynchronizedRef } from "effect";

type RawCoID = CojsonInternalTypes.RawCoID;

export type BlockFilename =
    `${RawCoID}-${RawCoID}-${string}-L${number}-H${number}.jsonl`;

type CoValueChunk = {
    header?: CoValueHeader;
    sessionEntries: {
        [sessionID: string]: {
            after: number;
            lastSignature: CojsonInternalTypes.Signature;
            transactions: CojsonInternalTypes.Transaction[];
        }[];
    };
};

type BlockHeader = { id: RawCoID; start: number; length: number }[];

type WalEntry = { id: RawCoID } & CoValueChunk;

type WalFilename = `wal-${number}.jsonl`;

export type FSErr = {
    type: "fileSystemError";
    error: Error;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export interface FileSystem<WriteHandle, ReadHandle> {
    createFile(filename: string): Effect.Effect<WriteHandle, FSErr>;
    append(handle: WriteHandle, data: Uint8Array): Effect.Effect<void, FSErr>;
    renameAndClose(
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
}

function _writeBlock<WH, RH, FS extends FileSystem<WH, RH>>(
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
        const hash = new cojsonInternals.StreamingHash();

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

        const filename: BlockFilename = `${blockHeader[0]!.id}-${
            blockHeader[blockHeader.length - 1]!.id
        }-${hash.digest()}-L${level}-H${headerBytes.length}.jsonl`;
        yield* $(fs.renameAndClose(file, filename));
    });
}

function _readHeader<RH, FS extends FileSystem<unknown, RH>>(
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

function _readChunk<RH, FS extends FileSystem<unknown, RH>>(
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
): Either.Either<CoValueChunk, "nonContigous"> {
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
            return Either.right("nonContigous");
        }
    }

    return Either.left({ header, sessionEntries: newSessions });
}

function loadChunkFromWal<WH, RH, FS extends FileSystem<WH, RH>>(
    id: RawCoID,
    fs: FS
): Effect.Effect<Option.Option<CoValueChunk>, FSErr> {
    return Effect.gen(function* ($) {
        const fileNames = yield* $(fs.listFiles());

        const walFiles = fileNames.filter((name) =>
            name.startsWith("wal-")
        ) as WalFilename[];
        walFiles.sort();

        let chunk: CoValueChunk | null = null;

        for (const fileName of walFiles) {
            const { handle, size } = yield* $(fs.openToRead(fileName));
            if (size === 0) continue;
            const bytes = yield* $(fs.read(handle, 0, size));
            const string = textDecoder.decode(bytes);
            const lines = string.split("\n");
            for (const line of lines) {
                if (line === "") {
                    continue;
                }
                const entry = JSON.parse(line);
                if (entry.id === id) {
                    if (chunk) {
                        const merged = mergeChunks(chunk, entry);
                        if (Either.isRight(merged)) {
                            yield* $(
                                Effect.logWarning(
                                    "Non-contigous chunks in " +
                                        id +
                                        ", " +
                                        fileName
                                )
                            );
                            return Option.some(chunk);
                        } else {
                            chunk = merged.left;
                        }
                    } else {
                        chunk = entry;
                    }
                }
            }
        }

        return chunk ? Option.some(chunk) : Option.none();
    });
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

function loadCoValue<WH, RH, FS extends FileSystem<WH, RH>>(
    id: RawCoID,
    fs: FS
): Effect.Effect<Option.Option<CoValueChunk>, FSErr> {
    return loadChunkFromWal(id, fs);
}

function contentSinceChunk(
    id: RawCoID,
    chunk: CoValueChunk,
    known?: CojsonInternalTypes.CoValueKnownState
): CojsonInternalTypes.NewContentMessage[] {
    const newContentPieces: CojsonInternalTypes.NewContentMessage[] = [];

    newContentPieces.push({
        id: id,
        action: "content",
        header: known?.header ? undefined : chunk.header,
        new: {}
    });

    for (const [sessionID, sessionsEntry] of Object.entries(
        chunk.sessionEntries
    )) {
        for (const entry of sessionsEntry) {
            const knownStart = known?.sessions[sessionID as SessionID] || 0;

            if (entry.after + entry.transactions.length <= knownStart) {
                continue;
            }

            const actuallyNewTransactions = entry.transactions.slice(Math.max(0, knownStart - entry.after));
            const newAfter = entry.after + (actuallyNewTransactions.length - entry.transactions.length);

            let newContentEntry = newContentPieces[0]?.new[sessionID as SessionID];

            if (!newContentEntry) {
                newContentEntry = {
                    after: newAfter,
                    lastSignature: entry.lastSignature,
                    newTransactions: actuallyNewTransactions,
                };
                newContentPieces[0]!.new[sessionID as SessionID] = newContentEntry;
            } else {
                newContentEntry.newTransactions.push(...actuallyNewTransactions);
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
    coValues: {
        [id: RawCoID]: SynchronizedRef.SynchronizedRef<
            Option.Option<CoValueChunk>
        >;
    };

    constructor(
        fs: FS,
        currentWal: WH,
        fromLocalNode: ReadableStream<SyncMessage>,
        toLocalNode: WritableStream<SyncMessage>
    ) {
        this.fs = fs;
        this.fromLocalNode = fromLocalNode.getReader();
        this.toLocalNode = toLocalNode.getWriter();
        this.coValues = {};
        this.currentWal = currentWal;

        Effect.runPromise(
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
    }

    sendNewContent(
        id: RawCoID,
        known: CojsonInternalTypes.CoValueKnownState | undefined,
        asDependencyOf: RawCoID | undefined
    ): Effect.Effect<void, FSErr> {
        return Effect.gen(this, function* ($) {
            let coValue = this.coValues[id];

            if (!coValue) {
                coValue = yield* $(
                    SynchronizedRef.make(Option.none<CoValueChunk>())
                );
            }

            yield* $(
                SynchronizedRef.updateEffect(coValue, (chunk) => {
                    if (Option.isNone(chunk)) {
                        return loadCoValue(id, this.fs);
                    } else {
                        return Effect.succeed(chunk);
                    }
                })
            );

            const chunk = yield* $(SynchronizedRef.get(coValue));

            if (Option.isNone(chunk)) {
                yield* $(
                    Effect.promise(() =>
                        this.toLocalNode.write({
                            id: id,
                            action: "known",
                            header: false,
                            sessions: {},
                            asDependencyOf,
                        })
                    )
                );
                return;
            }

            if (
                !known?.header &&
                chunk.value.header?.ruleset.type === "ownedByGroup"
            ) {
                yield* $(
                    this.sendNewContent(
                        chunk.value.header.ruleset.group,
                        undefined,
                        id
                    )
                );
            }

            const newContentMessages = contentSinceChunk(
                id,
                chunk.value,
                known
            ).map((message) => ({ ...message, asDependencyOf }));

            const ourKnown: CojsonInternalTypes.CoValueKnownState =
                chunkToKnownState(id, chunk);

            yield* $(
                Effect.promise(() =>
                    this.toLocalNode.write({ action: "known", ...ourKnown, asDependencyOf })
                )
            );

            for (const message of newContentMessages) {
                yield* $(Effect.promise(() => this.toLocalNode.write(message)));
            }
        });
    }

    handleNewContent(
        newContent: CojsonInternalTypes.NewContentMessage
    ): Effect.Effect<void, FSErr> {
        return Effect.gen(this, function* ($) {
            let coValue:
                | SynchronizedRef.SynchronizedRef<Option.Option<CoValueChunk>>
                | undefined = this.coValues[newContent.id];

            if (!coValue) {
                coValue = yield* $(
                    SynchronizedRef.make(Option.none<CoValueChunk>())
                );
            }

            const newContentAsChunk: CoValueChunk = {
                header: newContent.header,
                sessionEntries: Object.fromEntries(
                    Object.entries(newContent.new).map(
                        ([sessionID, newInSession]) => [
                            sessionID,
                            [
                                {
                                    after: newInSession.after,
                                    lastSignature: newInSession.lastSignature,
                                    transactions: newInSession.newTransactions,
                                },
                            ],
                        ]
                    )
                ),
            };

            yield* $(
                SynchronizedRef.updateEffect(coValue, (existingChunk) =>
                    Effect.gen(this, function* ($) {
                        if (Option.isNone(existingChunk)) {
                            if (newContent.header) {
                                yield* $(
                                    writeToWal(
                                        this.currentWal,
                                        this.fs,
                                        newContent.id,
                                        newContentAsChunk
                                    )
                                );
                                return Option.some(newContentAsChunk);
                            } else {
                                yield* $(
                                    Effect.promise(() =>
                                        this.toLocalNode.write({
                                            action: "known",
                                            id: newContent.id,
                                            header: false,
                                            sessions: {},
                                            isCorrection: true,
                                        })
                                    )
                                );
                                return Option.none();
                            }
                        } else {
                            const merged = mergeChunks(
                                existingChunk.value,
                                newContentAsChunk
                            );
                            if (Either.isRight(merged)) {
                                yield* $(
                                    Effect.logWarning(
                                        "Non-contigous new content for " +
                                            newContent.id
                                    )
                                );
                                yield* $(
                                    Effect.promise(() =>
                                        this.toLocalNode.write({
                                            action: "known",
                                            ...chunkToKnownState(
                                                newContent.id,
                                                existingChunk
                                            ),
                                            isCorrection: true,
                                        })
                                    )
                                );
                                return existingChunk;
                            } else {
                                yield* $(
                                    writeToWal(
                                        this.currentWal,
                                        this.fs,
                                        newContent.id,
                                        newContentAsChunk
                                    )
                                );
                                return Option.some(merged.left);
                            }
                        }
                    })
                )
            );
        });
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
                    cojsonInternals.connectedPeers(localNodeName, "storage", {
                        peer1role: "client",
                        peer2role: "server",
                        trace,
                    });

                const currentWal = yield* $(
                    fs.createFile(`wal-${new Date().toISOString()}-${Math.random().toString(36).slice(2)}.jsonl`)
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

function chunkToKnownState(id: RawCoID, chunk: Option.Some<CoValueChunk>) {
    const ourKnown: CojsonInternalTypes.CoValueKnownState = {
        id,
        header: !!chunk.value.header,
        sessions: {},
    };

    for (const [sessionID, sessionEntries] of Object.entries(
        chunk.value.sessionEntries
    )) {
        for (const entry of sessionEntries) {
            ourKnown.sessions[sessionID as SessionID] =
                entry.after + entry.transactions.length;
        }
    }
    return ourKnown;
}
