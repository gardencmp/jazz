import {
    cojsonInternals,
    SyncMessage,
    Peer,
    CojsonInternalTypes,
    SessionID,
    // CojsonInternalTypes,
    // SessionID,
} from "cojson";
import {
    ReadableStream,
    WritableStream,
    ReadableStreamDefaultReader,
    WritableStreamDefaultWriter,
} from "isomorphic-streams";

import Database, { Database as DatabaseT } from "better-sqlite3";
import { RawCoID } from "cojson/dist/ids";

type CoValueRow = {
    id: CojsonInternalTypes.RawCoID;
    header: string;
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
    tx: string;
};

export class SQLiteStorage {
    fromLocalNode!: ReadableStreamDefaultReader<SyncMessage>;
    toLocalNode: WritableStreamDefaultWriter<SyncMessage>;
    db: DatabaseT;

    constructor(
        db: DatabaseT,
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

    static async asPeer({
        filename,
        trace,
        localNodeName = "local",
    }: {
        filename: string;
        trace?: boolean;
        localNodeName?: string;
    }): Promise<Peer> {
        const [localNodeAsPeer, storageAsPeer] = cojsonInternals.connectedPeers(
            localNodeName,
            "storage",
            { peer1role: "client", peer2role: "server", trace }
        );

        await SQLiteStorage.open(
            filename,
            localNodeAsPeer.incoming,
            localNodeAsPeer.outgoing
        );

        return storageAsPeer;
    }

    static async open(
        filename: string,
        fromLocalNode: ReadableStream<SyncMessage>,
        toLocalNode: WritableStream<SyncMessage>
    ) {
        const db = Database(filename);
        db.pragma("journal_mode = WAL");

        db.prepare(
            `CREATE TABLE IF NOT EXISTS transactions (
                ses INTEGER,
                idx INTEGER,
                tx TEXT NOT NULL ,
                PRIMARY KEY (ses, idx)
            ) WITHOUT ROWID;`
        ).run();

        db.prepare(
            `CREATE TABLE IF NOT EXISTS sessions (
                rowID INTEGER PRIMARY KEY,
                coValue INTEGER NOT NULL,
                sessionID TEXT NOT NULL,
                lastIdx INTEGER,
                lastSignature TEXT,
                UNIQUE (sessionID, coValue)
            );`
        ).run();

        db.prepare(
            `CREATE INDEX IF NOT EXISTS sessionsByCoValue ON sessions (coValue);`
        ).run();

        db.prepare(
            `CREATE TABLE IF NOT EXISTS coValues (
                rowID INTEGER PRIMARY KEY,
                id TEXT NOT NULL UNIQUE,
                header TEXT NOT NULL UNIQUE
            );`
        ).run();

        db.prepare(
            `CREATE INDEX IF NOT EXISTS coValuesByID ON coValues (id);`
        ).run();

        return new SQLiteStorage(db, fromLocalNode, toLocalNode);
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
        asDependencyOf?: CojsonInternalTypes.RawCoID
    ) {
        const coValueRow = (await this.db
            .prepare(`SELECT * FROM coValues WHERE id = ?`)
            .get(theirKnown.id)) as StoredCoValueRow | undefined;

        const allOurSessions = coValueRow
            ? (this.db
                  .prepare<number>(`SELECT * FROM sessions WHERE coValue = ?`)
                  .all(coValueRow.rowID) as StoredSessionRow[])
            : [];

        const ourKnown: CojsonInternalTypes.CoValueKnownState = {
            id: theirKnown.id,
            header: !!coValueRow,
            sessions: {},
        };

        const parsedHeader = (coValueRow?.header &&
            JSON.parse(coValueRow.header)) as
            | CojsonInternalTypes.CoValueHeader
            | undefined;

        const newContent: CojsonInternalTypes.NewContentMessage = {
            action: "content",
            id: theirKnown.id,
            header: theirKnown.header ? undefined : parsedHeader,
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

                const newTxInSession = this.db
                    .prepare<[number, number]>(
                        `SELECT * FROM transactions WHERE ses = ? AND idx > ?`
                    )
                    .all(sessionRow.rowID, firstNewTxIdx) as TransactionRow[];

                newContent.new[sessionRow.sessionID] = {
                    after: firstNewTxIdx,
                    lastSignature: sessionRow.lastSignature,
                    newTransactions: newTxInSession.map((row) =>
                        JSON.parse(row.tx)
                    ),
                };
            }
        }

        const dependedOnCoValues =
            parsedHeader?.ruleset.type === "group"
                ? Object.values(newContent.new).flatMap((sessionEntry) =>
                      sessionEntry.newTransactions.flatMap((tx) => {
                          if (tx.privacy !== "trusting") return [];
                          // TODO: avoid parsing here?
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
                : parsedHeader?.ruleset.type === "ownedByGroup"
                ? [parsedHeader?.ruleset.group]
                : [];

        for (const dependedOnCoValue of dependedOnCoValues) {
            await this.sendNewContentAfter(
                { id: dependedOnCoValue, header: false, sessions: {} },
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
        return this.sendNewContentAfter(msg);
    }

    async handleContent(msg: CojsonInternalTypes.NewContentMessage) {
        let storedCoValueRowID = (
            this.db
                .prepare<RawCoID>(`SELECT rowID FROM coValues WHERE id = ?`)
                .get(msg.id) as StoredCoValueRow | undefined
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

            storedCoValueRowID = this.db
                .prepare<[RawCoID, string]>(
                    `INSERT INTO coValues (id, header) VALUES (?, ?)`
                )
                .run(msg.id, JSON.stringify(header)).lastInsertRowid as number;
        }

        const ourKnown: CojsonInternalTypes.CoValueKnownState = {
            id: msg.id,
            header: true,
            sessions: {},
        };
        let invalidAssumptions = false;

        this.db.transaction(() => {
            const allOurSessions = (
                this.db
                    .prepare<number>(`SELECT * FROM sessions WHERE coValue = ?`)
                    .all(storedCoValueRowID!) as StoredSessionRow[]
            ).reduce((acc, row) => {
                acc[row.sessionID] = row;
                return acc;
            }, {} as { [sessionID: string]: StoredSessionRow });

            for (const sessionID of Object.keys(msg.new) as SessionID[]) {
                const sessionRow = allOurSessions[sessionID];
                if (sessionRow) {
                    ourKnown.sessions[sessionRow.sessionID] =
                        sessionRow.lastIdx;
                }

                if (
                    (sessionRow?.lastIdx || 0) <
                    (msg.new[sessionID]?.after || 0)
                ) {
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
                        coValue: storedCoValueRowID!,
                        sessionID: sessionID,
                        lastIdx:
                            (sessionRow?.lastIdx || 0) +
                            actuallyNewTransactions.length,
                        lastSignature: msg.new[sessionID]!.lastSignature,
                    };

                    const upsertedSession = this.db
                        .prepare<[number, string, number, string]>(
                            `INSERT INTO sessions (coValue, sessionID, lastIdx, lastSignature) VALUES (?, ?, ?, ?)
                            ON CONFLICT(coValue, sessionID) DO UPDATE SET lastIdx=excluded.lastIdx, lastSignature=excluded.lastSignature
                            RETURNING rowID`
                        )
                        .get(
                            sessionUpdate.coValue,
                            sessionUpdate.sessionID,
                            sessionUpdate.lastIdx,
                            sessionUpdate.lastSignature
                        ) as { rowID: number };

                    const sessionRowID = upsertedSession.rowID;

                    for (const newTransaction of actuallyNewTransactions) {
                        nextIdx++;
                        this.db
                            .prepare<[number, number, string]>(
                                `INSERT INTO transactions (ses, idx, tx) VALUES (?, ?, ?)`
                            )
                            .run(
                                sessionRowID,
                                nextIdx,
                                JSON.stringify(newTransaction)
                            );
                    }
                }
            }
        })();

        if (invalidAssumptions) {
            await this.toLocalNode.write({
                action: "known",
                ...ourKnown,
                isCorrection: invalidAssumptions,
            });
        }
    }

    handleKnown(msg: CojsonInternalTypes.KnownStateMessage) {
        return this.sendNewContentAfter(msg);
    }

    handleDone(_msg: CojsonInternalTypes.DoneMessage) {}
}
