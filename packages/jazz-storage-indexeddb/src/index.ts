import {
    cojsonInternals,
    SessionID,
    SyncMessage,
    Peer,
    CojsonInternalTypes,
} from "cojson";
import {
    ReadableStream,
    WritableStream,
    ReadableStreamDefaultReader,
    WritableStreamDefaultWriter,
} from "isomorphic-streams";

type CoValueRow = {
    id: CojsonInternalTypes.RawCoID;
    header: CojsonInternalTypes.CoValueHeader;
};

type StoredCoValueRow = CoValueRow & { rowID: number };

type SessionRow = {
    coValue: number;
    sessionID: SessionID;
    lastIdx: number;
    lastSignature: CojsonInternalTypes.Signature;
};

type StoredSessionRow = SessionRow & { rowID: number };

type TransactionRow = {
    ses: number;
    idx: number;
    tx: CojsonInternalTypes.Transaction;
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
            let done = false;
            while (!done) {
                const result = await this.fromLocalNode.read();
                done = result.done;

                if (result.value) {
                    await this.handleSyncMessage(result.value);
                }
            }
        })();
    }

    static async asPeer(
        {
            trace,
            localNodeName = "local",
        }: { trace?: boolean; localNodeName?: string } | undefined = {
            localNodeName: "local",
        }
    ): Promise<Peer> {
        const [localNodeAsPeer, storageAsPeer] = cojsonInternals.connectedPeers(
            localNodeName,
            "storage",
            { peer1role: "client", peer2role: "server", trace }
        );

        await IDBStorage.open(
            localNodeAsPeer.incoming,
            localNodeAsPeer.outgoing
        );

        return storageAsPeer;
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

    async sendNewContentAfter(
        theirKnown: CojsonInternalTypes.CoValueKnownState,
        {
            coValues,
            sessions,
            transactions,
        }: {
            coValues: IDBObjectStore;
            sessions: IDBObjectStore;
            transactions: IDBObjectStore;
        },
        asDependencyOf?: CojsonInternalTypes.RawCoID
    ) {
        const coValueRow = await promised<StoredCoValueRow | undefined>(
            coValues.index("coValuesById").get(theirKnown.id)
        );

        const allOurSessions = coValueRow
            ? await promised<StoredSessionRow[]>(
                  sessions.index("sessionsByCoValue").getAll(coValueRow.rowID)
              )
            : [];

        const ourKnown: CojsonInternalTypes.CoValueKnownState = {
            id: theirKnown.id,
            header: !!coValueRow,
            sessions: {},
        };

        const newContent: CojsonInternalTypes.NewContentMessage = {
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

        const dependedOnCoValues =
            coValueRow?.header.ruleset.type === "group"
                ? Object.values(newContent.new).flatMap((sessionEntry) =>
                      sessionEntry.newTransactions.flatMap((tx) => {
                          if (tx.privacy !== "trusting") return [];
                          // TODO: avoid parse here?
                          return cojsonInternals
                              .parseJSON(tx.changes)
                              .map(
                                  (change) =>
                                      change &&
                                      typeof change === "object" &&
                                      "op" in change &&
                                      change.op === "set" &&
                                      "key" in change &&
                                      change.key
                              )
                              .filter(
                                  (key): key is CojsonInternalTypes.RawCoID =>
                                      typeof key === "string" &&
                                      key.startsWith("co_")
                              );
                      })
                  )
                : coValueRow?.header.ruleset.type === "ownedByGroup"
                ? [coValueRow?.header.ruleset.group]
                : [];

        for (const dependedOnCoValue of dependedOnCoValues) {
            await this.sendNewContentAfter(
                { id: dependedOnCoValue, header: false, sessions: {} },
                { coValues, sessions, transactions },
                asDependencyOf || theirKnown.id
            );
        }

        await this.toLocalNode.write({
            action: "known",
            ...ourKnown,
            asDependencyOf,
        });

        if (newContent.header || Object.keys(newContent.new).length > 0) {
            await this.toLocalNode.write(newContent);
        }
    }

    handleLoad(msg: CojsonInternalTypes.LoadMessage) {
        return this.sendNewContentAfter(msg, this.inTransaction("readonly"));
    }

    async handleContent(msg: CojsonInternalTypes.NewContentMessage) {
        const { coValues, sessions, transactions } =
            this.inTransaction("readwrite");

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

        const ourKnown: CojsonInternalTypes.CoValueKnownState = {
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

    handleKnown(msg: CojsonInternalTypes.KnownStateMessage) {
        return this.sendNewContentAfter(msg, this.inTransaction("readonly"));
    }

    handleDone(_msg: CojsonInternalTypes.DoneMessage) {}

    inTransaction(mode: "readwrite" | "readonly"): {
        coValues: IDBObjectStore;
        sessions: IDBObjectStore;
        transactions: IDBObjectStore;
    } {
        const tx = this.db.transaction(
            ["coValues", "sessions", "transactions"],
            mode
        );

        tx.onerror = (event) => {
            const target = event.target as unknown as {
                error: DOMException;
                source?: { name: string };
            } | null;
            throw new Error(
                `Error in transaction (${target?.source?.name}): ${target?.error}`,
                { cause: target?.error }
            );
        };
        const coValues = tx.objectStore("coValues");
        const sessions = tx.objectStore("sessions");
        const transactions = tx.objectStore("transactions");

        return { coValues, sessions, transactions };
    }
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
