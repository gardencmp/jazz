import { Effect, Either, Queue, Stream, SynchronizedRef } from "effect";
import { RawCoID } from "../ids.js";
import { CoValueHeader, Transaction } from "../coValueCore.js";
import { Signature } from "../crypto/crypto.js";
import {
    CoValueKnownState,
    IncomingSyncStream,
    NewContentMessage,
    OutgoingSyncQueue,
    Peer,
} from "../sync.js";
import { CoID, RawCoValue } from "../index.js";
import { connectedPeers } from "../streamUtils.js";
import {
    chunkToKnownState,
    contentSinceChunk,
    mergeChunks,
} from "./chunksAndKnownStates.js";
import {
    BlockFilename,
    FSErr,
    FileSystem,
    WalEntry,
    WalFilename,
    readChunk,
    readHeader,
    textDecoder,
    writeBlock,
    writeToWal,
} from "./FileSystem.js";
export type { FSErr, BlockFilename, WalFilename } from "./FileSystem.js";

export type CoValueChunk = {
    header?: CoValueHeader;
    sessionEntries: {
        [sessionID: string]: {
            after: number;
            lastSignature: Signature;
            transactions: Transaction[];
        }[];
    };
};

export class LSMStorage<WH, RH, FS extends FileSystem<WH, RH>> {
    currentWal: SynchronizedRef.SynchronizedRef<WH | undefined>;
    coValues: SynchronizedRef.SynchronizedRef<{
        [id: RawCoID]: CoValueChunk | undefined;
    }>;
    fileCache: string[] | undefined;
    headerCache = new Map<
        BlockFilename,
        { [id: RawCoID]: { start: number; length: number } }
    >();

    constructor(
        public fs: FS,
        public fromLocalNode: IncomingSyncStream,
        public toLocalNode: OutgoingSyncQueue,
    ) {
        this.coValues = SynchronizedRef.unsafeMake({});
        this.currentWal = SynchronizedRef.unsafeMake<WH | undefined>(undefined);

        void this.fromLocalNode.pipe(
            Stream.runForEach((msg) =>
                Effect.gen(this, function* () {
                    if (msg.action === "done") {
                        return;
                    }

                    if (msg.action === "content") {
                        yield* this.handleNewContent(msg);
                    } else {
                        yield* this.sendNewContent(msg.id, msg, undefined);
                    }
                }),
            ),
            Effect.runPromise,
        );

        setTimeout(() => this.compact(), 20000);
    }

    sendNewContent(
        id: RawCoID,
        known: CoValueKnownState | undefined,
        asDependencyOf: RawCoID | undefined,
    ): Effect.Effect<void, FSErr> {
        return SynchronizedRef.updateEffect(this.coValues, (coValues) =>
            this.sendNewContentInner(coValues, id, known, asDependencyOf),
        );
    }

    private sendNewContentInner(
        coValues: { [id: `co_z${string}`]: CoValueChunk | undefined },
        id: RawCoID,
        known: CoValueKnownState | undefined,
        asDependencyOf: RawCoID | undefined,
    ): Effect.Effect<
        { [id: `co_z${string}`]: CoValueChunk | undefined },
        FSErr,
        never
    > {
        return Effect.gen(this, function* () {
            let coValue = coValues[id];

            if (!coValue) {
                coValue = yield* this.loadCoValue(id, this.fs);
            }

            if (!coValue) {
                yield* Queue.offer(this.toLocalNode, {
                    id: id,
                    action: "known",
                    header: false,
                    sessions: {},
                    asDependencyOf,
                });

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
                    asDependencyOf || id,
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
                        asDependencyOf || id,
                    );
                }
            }

            const newContentMessages = contentSinceChunk(
                id,
                coValue,
                known,
            ).map((message) => ({ ...message, asDependencyOf }));

            const ourKnown: CoValueKnownState = chunkToKnownState(id, coValue);

            yield* Queue.offer(this.toLocalNode, {
                action: "known",
                ...ourKnown,
                asDependencyOf,
            });

            for (const message of newContentMessages) {
                if (Object.keys(message.new).length === 0) continue;
                yield* Queue.offer(this.toLocalNode, message);
            }

            return { ...coValues, [id]: coValue };
        });
    }

    withWAL(
        handler: (wal: WH) => Effect.Effect<void, FSErr>,
    ): Effect.Effect<void, FSErr> {
        return SynchronizedRef.updateEffect(this.currentWal, (wal) =>
            Effect.gen(this, function* () {
                let newWal = wal;
                if (!newWal) {
                    newWal = yield* this.fs.createFile(
                        `wal-${new Date().toISOString()}-${Math.random()
                            .toString(36)
                            .slice(2)}.jsonl`,
                    );
                }
                yield* handler(newWal);
                return newWal;
            }),
        );
    }

    handleNewContent(
        newContent: NewContentMessage,
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
                            ],
                        ),
                    ),
                };

                if (!coValue) {
                    if (newContent.header) {
                        // console.log("Creating in WAL", newContent.id);
                        yield* this.withWAL((wal) =>
                            writeToWal(
                                wal,
                                this.fs,
                                newContent.id,
                                newContentAsChunk,
                            ),
                        );

                        return {
                            ...coValues,
                            [newContent.id]: newContentAsChunk,
                        };
                    } else {
                        // yield*
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
                        yield* Effect.logWarning(
                            "Incontiguous incoming update for " + newContent.id,
                        );
                        return coValues;
                    }
                } else {
                    const merged = mergeChunks(coValue, newContentAsChunk);
                    if (Either.isRight(merged)) {
                        yield* Effect.logWarning(
                            "Non-contigous new content for " + newContent.id,
                            Object.entries(coValue.sessionEntries).map(
                                ([session, entries]) =>
                                    entries.map((entry) => ({
                                        session: session,
                                        after: entry.after,
                                        length: entry.transactions.length,
                                    })),
                            ),
                            Object.entries(
                                newContentAsChunk.sessionEntries,
                            ).map(([session, entries]) =>
                                entries.map((entry) => ({
                                    session: session,
                                    after: entry.after,
                                    length: entry.transactions.length,
                                })),
                            ),
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
                        // console.log("Appending to WAL", newContent.id);
                        yield* this.withWAL((wal) =>
                            writeToWal(
                                wal,
                                this.fs,
                                newContent.id,
                                newContentAsChunk,
                            ),
                        );

                        return { ...coValues, [newContent.id]: merged.left };
                    }
                }
            }),
        );
    }

    loadCoValue<WH, RH, FS extends FileSystem<WH, RH>>(
        id: RawCoID,
        fs: FS,
    ): Effect.Effect<CoValueChunk | undefined, FSErr> {
        // return _loadChunkFromWal(id, fs);
        return Effect.gen(this, function* () {
            const files = this.fileCache || (yield* fs.listFiles());
            this.fileCache = files;
            const blockFiles = files.filter((name) =>
                name.startsWith("hash_"),
            ) as BlockFilename[];

            for (const blockFile of blockFiles) {
                let cachedHeader:
                    | { [id: RawCoID]: { start: number; length: number } }
                    | undefined = this.headerCache.get(blockFile);

                const { handle, size } = yield* fs.openToRead(blockFile);

                // console.log("Attempting to load", id, blockFile);

                if (!cachedHeader) {
                    cachedHeader = {};
                    const header = yield* readHeader(
                        blockFile,
                        handle,
                        size,
                        fs,
                    );
                    for (const entry of header) {
                        cachedHeader[entry.id] = {
                            start: entry.start,
                            length: entry.length,
                        };
                    }

                    this.headerCache.set(blockFile, cachedHeader);
                }
                const headerEntry = cachedHeader[id];

                // console.log("Header entry", id, headerEntry);

                let result;
                if (headerEntry) {
                    result = yield* readChunk(handle, headerEntry, fs);
                }

                yield* fs.close(handle);

                return result;
            }

            return undefined;
        });
    }

    async compact() {
        await Effect.runPromise(
            Effect.gen(this, function* () {
                const fileNames = yield* this.fs.listFiles();

                const walFiles = fileNames.filter((name) =>
                    name.startsWith("wal-"),
                ) as WalFilename[];
                walFiles.sort();

                const coValues = new Map<RawCoID, CoValueChunk>();

                yield* Effect.log("Compacting WAL files", walFiles);
                if (walFiles.length === 0) return;

                yield* SynchronizedRef.updateEffect(this.currentWal, (wal) =>
                    Effect.gen(this, function* () {
                        if (wal) {
                            yield* this.fs.close(wal);
                        }
                        return undefined;
                    }),
                );

                for (const fileName of walFiles) {
                    const { handle, size }: { handle: RH; size: number } =
                        yield* this.fs.openToRead(fileName);
                    if (size === 0) {
                        yield* this.fs.close(handle);
                        continue;
                    }
                    const bytes = yield* this.fs.read(handle, 0, size);

                    const decoded = textDecoder.decode(bytes);
                    const lines = decoded.split("\n");

                    for (const line of lines) {
                        if (line.length === 0) continue;
                        const chunk = JSON.parse(line) as WalEntry;

                        const existingChunk = coValues.get(chunk.id);

                        if (existingChunk) {
                            const merged = mergeChunks(existingChunk, chunk);
                            if (Either.isRight(merged)) {
                                yield* Effect.logWarning(
                                    "Non-contigous chunks in " +
                                        chunk.id +
                                        ", " +
                                        fileName,
                                    existingChunk,
                                    chunk,
                                );
                            } else {
                                coValues.set(chunk.id, merged.left);
                            }
                        } else {
                            coValues.set(chunk.id, chunk);
                        }
                    }

                    yield* this.fs.close(handle);
                }

                yield* writeBlock(coValues, 0, this.fs);
                for (const walFile of walFiles) {
                    yield* this.fs.removeFile(walFile);
                }
                this.fileCache = undefined;
            }),
        );

        setTimeout(() => this.compact(), 5000);
    }

    static async asPeer<WH, RH, FS extends FileSystem<WH, RH>>({
        fs,
        trace,
        localNodeName = "local",
    }: {
        fs: FS;
        trace?: boolean;
        localNodeName?: string;
    }): Promise<Peer> {
        const [localNodeAsPeer, storageAsPeer] = await Effect.runPromise(
            connectedPeers(localNodeName, "storage", {
                peer1role: "client",
                peer2role: "server",
                trace,
            }),
        );

        new LSMStorage(fs, localNodeAsPeer.incoming, localNodeAsPeer.outgoing);

        // return { ...storageAsPeer, priority: 200 };
        return storageAsPeer;
    }
}
