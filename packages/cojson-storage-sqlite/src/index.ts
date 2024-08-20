import {
    cojsonInternals,
    SyncMessage,
    Peer,
    CojsonInternalTypes,
    SessionID,
    MAX_RECOMMENDED_TX_SIZE,
    AccountID,
    IncomingSyncStream,
    OutgoingSyncQueue,
} from "cojson";

import Database, { Database as DatabaseT } from "better-sqlite3";

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
    bytesSinceLastSignature?: number;
};

type StoredSessionRow = SessionRow & { rowID: number };

type TransactionRow = {
    ses: number;
    idx: number;
    tx: string;
};

type SignatureAfterRow = {
    ses: number;
    idx: number;
    signature: CojsonInternalTypes.Signature;
};

export class SQLiteStorage {
    toLocalNode: OutgoingSyncQueue;
    db: DatabaseT;

    constructor(
        db: DatabaseT,
        fromLocalNode: IncomingSyncStream,
        toLocalNode: OutgoingSyncQueue,
    ) {
        this.db = db;
        this.toLocalNode = toLocalNode;

        const processMessages = async () => {
            for await (const msg of fromLocalNode) {
                if (Math.random() < 1/100000) {
                    void toLocalNode.push("Simulated error" as unknown as SyncMessage)
                }
                try {
                    if (msg === "Disconnected" || msg === "PingTimeout") {
                        throw new Error("Unexpected Disconnected message");
                    }
                    await this.handleSyncMessage(msg);
                } catch (e) {
                    console.error(
                        new Error(
                            `Error reading from localNode, handling msg\n\n${JSON.stringify(
                                msg,
                                (k, v) =>
                                    k === "changes" || k === "encryptedChanges"
                                        ? v.slice(0, 20) + "..."
                                        : v,
                            )}`,
                            { cause: e },
                        ),
                    );
                }
            }
        };

        processMessages().catch((e) =>
            console.error("Error in processMessages in sqlite", e),
        );
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
            { peer1role: "client", peer2role: "server", trace, crashOnClose: true },
        );

        await SQLiteStorage.open(
            filename,
            localNodeAsPeer.incoming,
            localNodeAsPeer.outgoing,
        );

        return { ...storageAsPeer, priority: 100 };
    }

    static async open(
        filename: string,
        fromLocalNode: IncomingSyncStream,
        toLocalNode: OutgoingSyncQueue,
    ) {
        const db = Database(filename);
        db.pragma("journal_mode = WAL");

        const oldVersion = (
            db.pragma("user_version") as [{ user_version: number }]
        )[0].user_version as number;

        console.log("DB version", oldVersion);

        if (oldVersion === 0) {
            console.log("Migration 0 -> 1: Basic schema");
            db.prepare(
                `CREATE TABLE IF NOT EXISTS transactions (
                    ses INTEGER,
                    idx INTEGER,
                    tx TEXT NOT NULL,
                    PRIMARY KEY (ses, idx)
                ) WITHOUT ROWID;`,
            ).run();

            db.prepare(
                `CREATE TABLE IF NOT EXISTS sessions (
                    rowID INTEGER PRIMARY KEY,
                    coValue INTEGER NOT NULL,
                    sessionID TEXT NOT NULL,
                    lastIdx INTEGER,
                    lastSignature TEXT,
                    UNIQUE (sessionID, coValue)
                );`,
            ).run();

            db.prepare(
                `CREATE INDEX IF NOT EXISTS sessionsByCoValue ON sessions (coValue);`,
            ).run();

            db.prepare(
                `CREATE TABLE IF NOT EXISTS coValues (
                    rowID INTEGER PRIMARY KEY,
                    id TEXT NOT NULL UNIQUE,
                    header TEXT NOT NULL UNIQUE
                );`,
            ).run();

            db.prepare(
                `CREATE INDEX IF NOT EXISTS coValuesByID ON coValues (id);`,
            ).run();

            db.pragma("user_version = 1");
            console.log("Migration 0 -> 1: Basic schema - done");
        }

        if (oldVersion <= 1) {
            // fix embarrassing off-by-one error for transaction indices
            console.log(
                "Migration 1 -> 2: Fix off-by-one error for transaction indices",
            );

            const txs = db
                .prepare(`SELECT * FROM transactions`)
                .all() as TransactionRow[];

            for (const tx of txs) {
                db.prepare(
                    `DELETE FROM transactions WHERE ses = ? AND idx = ?`,
                ).run(tx.ses, tx.idx);
                tx.idx -= 1;
                db.prepare(
                    `INSERT INTO transactions (ses, idx, tx) VALUES (?, ?, ?)`,
                ).run(tx.ses, tx.idx, tx.tx);
            }

            db.pragma("user_version = 2");
            console.log(
                "Migration 1 -> 2: Fix off-by-one error for transaction indices - done",
            );
        }

        if (oldVersion <= 2) {
            console.log("Migration 2 -> 3: Add signatureAfter");

            db.prepare(
                `CREATE TABLE IF NOT EXISTS signatureAfter (
                    ses INTEGER,
                    idx INTEGER,
                    signature TEXT NOT NULL,
                    PRIMARY KEY (ses, idx)
                ) WITHOUT ROWID;`,
            ).run();

            db.prepare(
                `ALTER TABLE sessions ADD COLUMN bytesSinceLastSignature INTEGER;`,
            ).run();

            db.pragma("user_version = 3");
            console.log("Migration 2 -> 3: Add signatureAfter - done");
        }

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
        asDependencyOf?: CojsonInternalTypes.RawCoID,
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

        let parsedHeader;

        try {
            parsedHeader = (coValueRow?.header &&
                JSON.parse(coValueRow.header)) as
                | CojsonInternalTypes.CoValueHeader
                | undefined;
        } catch (e) {
            console.warn(
                theirKnown.id,
                "Invalid JSON in header",
                e,
                coValueRow?.header,
            );
            return;
        }

        const newContentPieces: CojsonInternalTypes.NewContentMessage[] = [
            {
                action: "content",
                id: theirKnown.id,
                header: theirKnown.header ? undefined : parsedHeader,
                new: {},
            },
        ];

        for (const sessionRow of allOurSessions) {
            ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;

            if (
                sessionRow.lastIdx >
                (theirKnown.sessions[sessionRow.sessionID] || 0)
            ) {
                const firstNewTxIdx =
                    theirKnown.sessions[sessionRow.sessionID] || 0;

                const signaturesAndIdxs = this.db
                    .prepare<[number, number]>(
                        `SELECT * FROM signatureAfter WHERE ses = ? AND idx >= ?`,
                    )
                    .all(
                        sessionRow.rowID,
                        firstNewTxIdx,
                    ) as SignatureAfterRow[];

                // console.log(
                //     theirKnown.id,
                //     "signaturesAndIdxs",
                //     JSON.stringify(signaturesAndIdxs)
                // );

                const newTxInSession = this.db
                    .prepare<[number, number]>(
                        `SELECT * FROM transactions WHERE ses = ? AND idx >= ?`,
                    )
                    .all(sessionRow.rowID, firstNewTxIdx) as TransactionRow[];

                let idx = firstNewTxIdx;

                // console.log(
                //     theirKnown.id,
                //     "newTxInSession",
                //     newTxInSession.length
                // );

                for (const tx of newTxInSession) {
                    let sessionEntry =
                        newContentPieces[newContentPieces.length - 1]!.new[
                            sessionRow.sessionID
                        ];
                    if (!sessionEntry) {
                        sessionEntry = {
                            after: idx,
                            lastSignature:
                                "WILL_BE_REPLACED" as CojsonInternalTypes.Signature,
                            newTransactions: [],
                        };
                        newContentPieces[newContentPieces.length - 1]!.new[
                            sessionRow.sessionID
                        ] = sessionEntry;
                    }

                    let parsedTx;

                    try {
                        parsedTx = JSON.parse(tx.tx);
                    } catch (e) {
                        console.warn(
                            theirKnown.id,
                            "Invalid JSON in transaction",
                            e,
                            tx.tx,
                        );
                        break;
                    }

                    sessionEntry.newTransactions.push(parsedTx);

                    if (
                        signaturesAndIdxs[0] &&
                        idx === signaturesAndIdxs[0].idx
                    ) {
                        sessionEntry.lastSignature =
                            signaturesAndIdxs[0].signature;
                        signaturesAndIdxs.shift();
                        newContentPieces.push({
                            action: "content",
                            id: theirKnown.id,
                            new: {},
                        });
                    } else if (
                        idx ===
                        firstNewTxIdx + newTxInSession.length - 1
                    ) {
                        sessionEntry.lastSignature = sessionRow.lastSignature;
                    }
                    idx += 1;
                }
            }
        }

        const dependedOnCoValues =
            parsedHeader?.ruleset.type === "group"
                ? newContentPieces
                      .flatMap((piece) => Object.values(piece.new))
                      .flatMap((sessionEntry) =>
                          sessionEntry.newTransactions.flatMap((tx) => {
                              if (tx.privacy !== "trusting") return [];
                              // TODO: avoid parsing here?
                              let parsedChanges;

                              try {
                                  parsedChanges = cojsonInternals.parseJSON(
                                      tx.changes,
                                  );
                              } catch (e) {
                                  console.warn(
                                      theirKnown.id,
                                      "Invalid JSON in transaction",
                                      e,
                                      tx.changes,
                                  );
                                  return [];
                              }

                              return parsedChanges
                                  .map(
                                      (change) =>
                                          change &&
                                          typeof change === "object" &&
                                          "op" in change &&
                                          change.op === "set" &&
                                          "key" in change &&
                                          change.key,
                                  )
                                  .filter(
                                      (
                                          key,
                                      ): key is CojsonInternalTypes.RawCoID =>
                                          typeof key === "string" &&
                                          key.startsWith("co_"),
                                  );
                          }),
                      )
                : parsedHeader?.ruleset.type === "ownedByGroup"
                  ? [
                        parsedHeader?.ruleset.group,
                        ...new Set(
                            newContentPieces.flatMap((piece) =>
                                Object.keys(piece)
                                    .map((sessionID) =>
                                        cojsonInternals.accountOrAgentIDfromSessionID(
                                            sessionID as SessionID,
                                        ),
                                    )
                                    .filter(
                                        (accountID): accountID is AccountID =>
                                            cojsonInternals.isAccountID(
                                                accountID,
                                            ) && accountID !== theirKnown.id,
                                    ),
                            ),
                        ),
                    ]
                  : [];

        for (const dependedOnCoValue of dependedOnCoValues) {
            await this.sendNewContentAfter(
                { id: dependedOnCoValue, header: false, sessions: {} },
                asDependencyOf || theirKnown.id,
            );
        }

        this.toLocalNode
            .push({
                action: "known",
                ...ourKnown,
                asDependencyOf,
            })
            .catch((e) => console.error("Error while pushing known", e));

        const nonEmptyNewContentPieces = newContentPieces.filter(
            (piece) => piece.header || Object.keys(piece.new).length > 0,
        );

        // console.log(theirKnown.id, nonEmptyNewContentPieces);

        for (const piece of nonEmptyNewContentPieces) {
            this.toLocalNode
                .push(piece)
                .catch((e) =>
                    console.error("Error while pushing content piece", e),
                );
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
    }

    handleLoad(msg: CojsonInternalTypes.LoadMessage) {
        return this.sendNewContentAfter(msg);
    }

    async handleContent(msg: CojsonInternalTypes.NewContentMessage) {
        let storedCoValueRowID = (
            this.db
                .prepare<CojsonInternalTypes.RawCoID>(
                    `SELECT rowID FROM coValues WHERE id = ?`,
                )
                .get(msg.id) as StoredCoValueRow | undefined
        )?.rowID;

        if (storedCoValueRowID === undefined) {
            const header = msg.header;
            if (!header) {
                console.error("Expected to be sent header first");
                this.toLocalNode
                    .push({
                        action: "known",
                        id: msg.id,
                        header: false,
                        sessions: {},
                        isCorrection: true,
                    })
                    .catch((e) =>
                        console.error("Error while pushing known", e),
                    );
                return;
            }

            storedCoValueRowID = this.db
                .prepare<[CojsonInternalTypes.RawCoID, string]>(
                    `INSERT INTO coValues (id, header) VALUES (?, ?)`,
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
            ).reduce(
                (acc, row) => {
                    acc[row.sessionID] = row;
                    return acc;
                },
                {} as { [sessionID: string]: StoredSessionRow },
            );

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

                    let newBytesSinceLastSignature =
                        (sessionRow?.bytesSinceLastSignature || 0) +
                        actuallyNewTransactions.reduce(
                            (sum, tx) =>
                                sum +
                                (tx.privacy === "private"
                                    ? tx.encryptedChanges.length
                                    : tx.changes.length),
                            0,
                        );

                    const newLastIdx =
                        (sessionRow?.lastIdx || 0) +
                        actuallyNewTransactions.length;

                    let shouldWriteSignature = false;

                    if (newBytesSinceLastSignature > MAX_RECOMMENDED_TX_SIZE) {
                        shouldWriteSignature = true;
                        newBytesSinceLastSignature = 0;
                    }

                    let nextIdx = sessionRow?.lastIdx || 0;

                    const sessionUpdate = {
                        coValue: storedCoValueRowID!,
                        sessionID: sessionID,
                        lastIdx: newLastIdx,
                        lastSignature: msg.new[sessionID]!.lastSignature,
                        bytesSinceLastSignature: newBytesSinceLastSignature,
                    };

                    const upsertedSession = this.db
                        .prepare<[number, string, number, string, number]>(
                            `INSERT INTO sessions (coValue, sessionID, lastIdx, lastSignature, bytesSinceLastSignature) VALUES (?, ?, ?, ?, ?)
                            ON CONFLICT(coValue, sessionID) DO UPDATE SET lastIdx=excluded.lastIdx, lastSignature=excluded.lastSignature, bytesSinceLastSignature=excluded.bytesSinceLastSignature
                            RETURNING rowID`,
                        )
                        .get(
                            sessionUpdate.coValue,
                            sessionUpdate.sessionID,
                            sessionUpdate.lastIdx,
                            sessionUpdate.lastSignature,
                            sessionUpdate.bytesSinceLastSignature,
                        ) as { rowID: number };

                    const sessionRowID = upsertedSession.rowID;

                    if (shouldWriteSignature) {
                        this.db
                            .prepare<[number, number, string]>(
                                `INSERT INTO signatureAfter (ses, idx, signature) VALUES (?, ?, ?)`,
                            )
                            .run(
                                sessionRowID,
                                // TODO: newLastIdx is a misnomer, it's actually more like nextIdx or length
                                newLastIdx - 1,
                                msg.new[sessionID]!.lastSignature,
                            );
                    }

                    for (const newTransaction of actuallyNewTransactions) {
                        this.db
                            .prepare<[number, number, string]>(
                                `INSERT INTO transactions (ses, idx, tx) VALUES (?, ?, ?)`,
                            )
                            .run(
                                sessionRowID,
                                nextIdx,
                                JSON.stringify(newTransaction),
                            );
                        nextIdx++;
                    }
                }
            }
        })();

        if (invalidAssumptions) {
            this.toLocalNode
                .push({
                    action: "known",
                    ...ourKnown,
                    isCorrection: invalidAssumptions,
                })
                .catch((e) => console.error("Error while pushing known", e));
        }
    }

    handleKnown(msg: CojsonInternalTypes.KnownStateMessage) {
        return this.sendNewContentAfter(msg);
    }

    handleDone(_msg: CojsonInternalTypes.DoneMessage) {}
}
