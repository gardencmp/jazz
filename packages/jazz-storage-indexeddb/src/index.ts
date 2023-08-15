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
import { ReadableStream, WritableStream, ReadableStreamDefaultReader, WritableStreamDefaultWriter } from "isomorphic-streams";

type CoValueRow = {
    id: RawCoID;
    header: CoValueHeader;
};

type SessionRow = {
    coValue: number;
    sessionID: SessionID;
    lastIdx: number;
    lastSignature: Signature;
};

type StoredSessionRow = SessionRow & { rowID: number };

type TransactionRow = {
    ses: SessionID;
    idx: number;
    tx: Transaction;
};

export class IDBStorage {
    db: IDBDatabase;
    fromLocalNode!: ReadableStreamDefaultReader<SyncMessage>;
    toLocalNode: WritableStreamDefaultWriter<SyncMessage>;

    constructor(db: IDBDatabase, fromLocalNode: ReadableStream<SyncMessage>, toLocalNode: WritableStream<SyncMessage>) {
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

    static async connectTo(localNode: LocalNode, {trace}: {trace?: boolean} = {}) {
        const [localNodeAsPeer, storageAsPeer] = cojsonInternals.connectedPeers("local", "storage", {peer1role: "client", peer2role: "server", trace});

        await IDBStorage.open(localNodeAsPeer.incoming, localNodeAsPeer.outgoing);

        localNode.sync.addPeer(storageAsPeer);
    }

    static async open(fromLocalNode: ReadableStream<SyncMessage>, toLocalNode: WritableStream<SyncMessage>) {
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

                coValues.createIndex("id", "id", {
                    unique: true,
                });

                const sessions = db.createObjectStore("sessions", {
                    keyPath: ["coValue", "sessionID"],
                });

                sessions.createIndex("sessionID", "sessionID", {
                    unique: true,
                });

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
        theirKnown: CoValueKnownState
    ) {
            const tx = this.db.transaction(
                ["coValues", "sessions", "transactions"],
                "readonly"
            );

            tx.onerror = () => {
                throw(new Error("Error in transaction", { cause: tx.error }));
            };

            const coValues = tx.objectStore("coValues");
            const sessions = tx.objectStore("sessions");
            const transactions = tx.objectStore("transactions");

            const header = await new Promise<CoValueHeader | undefined>(
                (resolve) => {
                    if (theirKnown.header) {
                        resolve(undefined);
                    } else {
                        const headerRequest = coValues.get(theirKnown.id);

                        headerRequest.onsuccess = () => {
                            resolve(
                                (headerRequest.result as CoValueRow).header
                            );
                        };
                    }
                }
            );

            const allOurSessions = await new Promise<StoredSessionRow[]>(
                (resolve) => {
                    const allOurSessionsRequest = sessions
                        .index("sessionID")
                        .getAll(
                            IDBKeyRange.bound(
                                [theirKnown.id, "\u0000"],
                                [theirKnown.id, "\uffff"]
                            )
                        );

                    allOurSessionsRequest.onsuccess = () => {
                        resolve(
                            allOurSessionsRequest.result as StoredSessionRow[]
                        );
                    };
                }
            );

            const ourKnown: CoValueKnownState = {
                id: theirKnown.id,
                header: !!header,
                sessions: {},
            };
            let shouldTellOurKnown = (
                Object.keys(theirKnown.sessions) as SessionID[]
            ).some((sessionID) => {
                return !allOurSessions.some(
                    (row) => row.sessionID === sessionID
                );
            });

            const newContent: NewContentMessage = {
                action: "content",
                id: theirKnown.id,
                header,
                new: {},
            };

            for (const sessionRow of allOurSessions) {
                ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;

                if (
                    sessionRow.lastIdx <
                    (theirKnown.sessions[sessionRow.sessionID] || 0)
                ) {
                    shouldTellOurKnown = true;
                } else if (
                    sessionRow.lastIdx >
                    (theirKnown.sessions[sessionRow.sessionID] || 0)
                ) {
                    const firstNewTxIdx =
                        theirKnown.sessions[sessionRow.sessionID] || 0;

                    const newTxInSession = await new Promise<TransactionRow[]>(
                        (resolve) => {
                            const newTxRequest = transactions.getAll(
                                IDBKeyRange.bound(
                                    [sessionRow.rowID, firstNewTxIdx],
                                    [sessionRow.rowID, Infinity]
                                )
                            );

                            newTxRequest.onsuccess = () => {
                                resolve(
                                    newTxRequest.result as TransactionRow[]
                                );
                            };
                        }
                    );

                    newContent.new[sessionRow.sessionID] = {
                        after: firstNewTxIdx,
                        lastSignature: sessionRow.lastSignature,
                        newTransactions: newTxInSession.map((row) => row.tx),
                    };
                }
            }

            if (shouldTellOurKnown) {
                await this.toLocalNode.write({
                    action: "known",
                    ...ourKnown,
                });
            }

            if (newContent.header || Object.keys(newContent.new).length > 0) {
                await this.toLocalNode.write(newContent);
            }
    }

    handleLoad(msg: LoadMessage) {
        return this.sendNewContentAfter(msg);
    }

    handleContent(msg: NewContentMessage) {
        const tx = this.db.transaction(
            ["coValues", "sessions", "transactions"],
            "readwrite"
        );

        tx.onerror = () => {
            throw(new Error("Error in transaction", { cause: tx.error }));
        };

        const coValues = tx.objectStore("coValues");
        const sessions = tx.objectStore("sessions");
        const transactions = tx.objectStore("transactions");


    }

    handleKnown(msg: KnownStateMessage) {
        return this.sendNewContentAfter(msg);
    }

    handleDone(msg: DoneMessage) {}
}

