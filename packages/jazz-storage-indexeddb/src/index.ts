import {
    LocalNode,
    internals as cojsonInternals,
    SessionID,
    ContentType,
    SyncMessage,
    JsonValue,
} from "cojson";
import { CoValueHeader, Transaction } from "cojson/src/coValue";
import { Signature } from "cojson/src/crypto";
import { RawCoID } from "cojson/src/ids";
import {
    CoValueKnownState,
    DoneMessage,
    KnownStateMessage,
    LoadMessage,
    NewContentMessage,
} from "cojson/src/sync";
import {
    ReadableStream,
    WritableStream,
    ReadableStreamDefaultReader,
    WritableStreamDefaultWriter,
} from "isomorphic-streams";

type CoValueRow = {
    id: RawCoID;
    header: CoValueHeader;
};

type StoredCoValueRow = CoValueRow & { rowID: number };

type SessionRow = {
    coValue: number;
    sessionID: SessionID;
    lastIdx: number;
    lastSignature: Signature;
};

type StoredSessionRow = SessionRow & { rowID: number };

type TransactionRow = {
    ses: number;
    idx: number;
    tx: Transaction;
};

export class IDBStorage {
    db: IDBDatabase;
    fromLocalNode!: ReadableStreamDefaultReader<SyncMessage>;
    toLocalNode: WritableStreamDefaultWriter<SyncMessage>;

    constructor(
        db: IDBDatabase,
        fromLocalNode: ReadableStream<SyncMessage>,
        toLocalNode: WritableStream<SyncMessage>
    ) {
        this.db = db;
        this.fromLocalNode = fromLocalNode.getReader();
        this.toLocalNode = toLocalNode.getWriter();

        (async () => {
            while (true) {
                const { done, value } = await this.fromLocalNode.read();
                if (done) {
                    break;
                }

                this.handleSyncMessage(value);
            }
        })();
    }

    static async connectTo(
        localNode: LocalNode,
        {
            trace,
            localNodeName = "local",
        }: { trace?: boolean; localNodeName?: string } | undefined = {
            localNodeName: "local",
        }
    ) {
        const [localNodeAsPeer, storageAsPeer] = cojsonInternals.connectedPeers(
            localNodeName,
            "storage",
            { peer1role: "client", peer2role: "server", trace }
        );

        await IDBStorage.open(
            localNodeAsPeer.incoming,
            localNodeAsPeer.outgoing
        );

        localNode.sync.addPeer(storageAsPeer);
    }

    static async open(
        fromLocalNode: ReadableStream<SyncMessage>,
        toLocalNode: WritableStream<SyncMessage>
    ) {
        const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open("jazz-storage", 1);
            request.onerror = () => {
                reject(request.error);
            };
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onupgradeneeded = () => {
                const db = request.result;

                const coValues = db.createObjectStore("coValues", {
                    autoIncrement: true,
                    keyPath: "rowID",
                });

                coValues.createIndex("coValuesById", "id", {
                    unique: true,
                });

                const sessions = db.createObjectStore("sessions", {
                    autoIncrement: true,
                    keyPath: "rowID",
                });

                sessions.createIndex("sessionsByCoValue", "coValue");
                sessions.createIndex(
                    "uniqueSessions",
                    ["coValue", "sessionID"],
                    {
                        unique: true,
                    }
                );

                db.createObjectStore("transactions", {
                    keyPath: ["ses", "idx"],
                });
            };
        });

        return new IDBStorage(await dbPromise, fromLocalNode, toLocalNode);
    }

    async handleSyncMessage(msg: SyncMessage) {
        switch (msg.action) {
            case "load":
                await this.handleLoad(msg);
                break;
            case "content":
                await this.handleContent(msg);
                break;
            case "known":
                await this.handleKnown(msg);
                break;
            case "done":
                await this.handleDone(msg);
                break;
        }
    }

    async sendNewContentAfter(theirKnown: CoValueKnownState) {
        const tx = this.db.transaction(
            ["coValues", "sessions", "transactions"],
            "readonly"
        );

        tx.onerror = (event) => {
            throw new Error(
                `Error in transaction (${
                    (event.target as any).source?.name
                }): ${(event.target as any).error}`,
                { cause: (event.target as any).error }
            );
        };

        const coValues = tx.objectStore("coValues");
        const sessions = tx.objectStore("sessions");
        const transactions = tx.objectStore("transactions");

        const coValueRow = await promised<StoredCoValueRow | undefined>(
            coValues.index("coValuesById").get(theirKnown.id)
        );

        const allOurSessions = coValueRow
            ? await promised<StoredSessionRow[]>(
                  sessions.index("sessionsByCoValue").getAll(coValueRow.rowID)
              )
            : [];

        const ourKnown: CoValueKnownState = {
            id: theirKnown.id,
            header: !!coValueRow,
            sessions: {},
        };

        const newContent: NewContentMessage = {
            action: "content",
            id: theirKnown.id,
            header: theirKnown.header ? undefined : coValueRow?.header,
            new: {},
        };

        for (const sessionRow of allOurSessions) {
            ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;

            if (
                sessionRow.lastIdx >
                (theirKnown.sessions[sessionRow.sessionID] || 0)
            ) {
                const firstNewTxIdx =
                    theirKnown.sessions[sessionRow.sessionID] || 0;

                const newTxInSession = await promised<TransactionRow[]>(
                    transactions.getAll(
                        IDBKeyRange.bound(
                            [sessionRow.rowID, firstNewTxIdx],
                            [sessionRow.rowID, Infinity]
                        )
                    )
                );

                newContent.new[sessionRow.sessionID] = {
                    after: firstNewTxIdx,
                    lastSignature: sessionRow.lastSignature,
                    newTransactions: newTxInSession.map((row) => row.tx),
                };
            }
        }

        await this.toLocalNode.write({
            action: "known",
            ...ourKnown,
        });

        if (newContent.header || Object.keys(newContent.new).length > 0) {
            await this.toLocalNode.write(newContent);
        }
    }

    handleLoad(msg: LoadMessage) {
        return this.sendNewContentAfter(msg);
    }

    async handleContent(msg: NewContentMessage) {
        const tx = this.db.transaction(
            ["coValues", "sessions", "transactions"],
            "readwrite"
        );

        tx.onerror = (event) => {
            throw new Error(
                `Error in transaction (${
                    (event.target as any).source?.name
                }): ${(event.target as any).error}`,
                { cause: (event.target as any).error }
            );
        };

        const coValues = tx.objectStore("coValues");
        const sessions = tx.objectStore("sessions");
        const transactions = tx.objectStore("transactions");

        let storedCoValueRowID = (
            await promised<StoredCoValueRow | undefined>(
                coValues.index("coValuesById").get(msg.id)
            )
        )?.rowID;

        if (storedCoValueRowID === undefined) {
            const header = msg.header;
            if (!header) {
                console.error("Expected to be sent header first");
                await this.toLocalNode.write({
                    action: "known",
                    id: msg.id,
                    header: false,
                    sessions: {},
                    isCorrection: true,
                });
                return;
            }

            storedCoValueRowID = (await promised<IDBValidKey>(
                coValues.put({
                    id: msg.id,
                    header: header,
                } satisfies CoValueRow)
            )) as number;
        }

        const allOurSessions = await new Promise<{
            [sessionID: SessionID]: StoredSessionRow;
        }>((resolve) => {
            const allOurSessionsRequest = sessions
                .index("sessionsByCoValue")
                .getAll(storedCoValueRowID);

            allOurSessionsRequest.onsuccess = () => {
                resolve(
                    Object.fromEntries(
                        (
                            allOurSessionsRequest.result as StoredSessionRow[]
                        ).map((row) => [row.sessionID, row])
                    )
                );
            };
        });

        const ourKnown: CoValueKnownState = {
            id: msg.id,
            header: true,
            sessions: {},
        };
        let invalidAssumptions = false;

        for (const sessionID of Object.keys(msg.new) as SessionID[]) {
            const sessionRow = allOurSessions[sessionID];
            if (sessionRow) {
                ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;
            }

            if ((sessionRow?.lastIdx || 0) < (msg.new[sessionID]?.after || 0)) {
                invalidAssumptions = true;
            } else {
                const newTransactions =
                    msg.new[sessionID]?.newTransactions || [];

                const actuallyNewOffset =
                    (sessionRow?.lastIdx || 0) -
                    (msg.new[sessionID]?.after || 0);
                const actuallyNewTransactions =
                    newTransactions.slice(actuallyNewOffset);

                let nextIdx = sessionRow?.lastIdx || 0;

                const sessionUpdate = {
                    coValue: storedCoValueRowID,
                    sessionID: sessionID,
                    lastIdx:
                        (sessionRow?.lastIdx || 0) +
                        actuallyNewTransactions.length,
                    lastSignature: msg.new[sessionID]!.lastSignature,
                };

                const sessionRowID = (await promised(
                    sessions.put(
                        sessionRow?.rowID
                            ? {
                                  rowID: sessionRow.rowID,
                                  ...sessionUpdate,
                              }
                            : sessionUpdate
                    )
                )) as number;

                for (const newTransaction of actuallyNewTransactions) {
                    nextIdx++;
                    await promised(
                        transactions.add({
                            ses: sessionRowID,
                            idx: nextIdx,
                            tx: newTransaction,
                        } satisfies TransactionRow)
                    );
                }
            }
        }

        if (invalidAssumptions) {
            await this.toLocalNode.write({
                action: "known",
                ...ourKnown,
                isCorrection: invalidAssumptions,
            });
        }
    }

    handleKnown(msg: KnownStateMessage) {
        return this.sendNewContentAfter(msg);
    }

    handleDone(msg: DoneMessage) {}
}

function promised<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}
