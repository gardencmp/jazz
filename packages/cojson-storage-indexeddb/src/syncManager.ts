import {
  CojsonInternalTypes,
  IncomingSyncStream,
  MAX_RECOMMENDED_TX_SIZE,
  OutgoingSyncQueue,
  Peer,
  RawAccountID,
  SessionID,
  SyncMessage,
  cojsonInternals,
} from "cojson";
import { IDBClient, MakeRequestFunction } from "./idbClient";
import { SyncPromise } from "./syncPromises.js";

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
  bytesSinceLastSignature?: number;
};

type StoredSessionRow = SessionRow & { rowID: number };

type TransactionRow = {
  ses: number;
  idx: number;
  tx: CojsonInternalTypes.Transaction;
};

type SignatureAfterRow = {
  ses: number;
  idx: number;
  signature: CojsonInternalTypes.Signature;
};

export class SyncManager {
  private readonly makeRequest: MakeRequestFunction;
  private readonly toLocalNode: OutgoingSyncQueue;

  constructor(dbClient: IDBClient, toLocalNode: OutgoingSyncQueue) {
    this.makeRequest = dbClient.makeRequest.bind(dbClient);
    this.toLocalNode = toLocalNode;
  }

  async handleSyncMessage(msg: SyncMessage) {
    console.log("▶▶▶ Received message", msg);
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

  async handleSessionUpdate(
    sessionRow: StoredSessionRow,
    theirKnown: CojsonInternalTypes.CoValueKnownState,
    ourKnown: CojsonInternalTypes.CoValueKnownState,
    newContentPieces: CojsonInternalTypes.NewContentMessage[],
  ) {
    ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;

    if (sessionRow.lastIdx <= (theirKnown.sessions[sessionRow.sessionID] || 0))
      return;

    const firstNewTxIdx = theirKnown.sessions[sessionRow.sessionID] || 0;

    const signaturesAndIdxs = await this.makeRequest<SignatureAfterRow[]>(
      ({ signatureAfter }: { signatureAfter: IDBObjectStore }) =>
        signatureAfter.getAll(
          IDBKeyRange.bound(
            [sessionRow.rowID, firstNewTxIdx],
            [sessionRow.rowID, Infinity],
          ),
        ),
    );

    const newTxsInSession = await this.makeRequest<TransactionRow[]>(
      ({ transactions }) =>
        transactions.getAll(
          IDBKeyRange.bound(
            [sessionRow.rowID, firstNewTxIdx],
            [sessionRow.rowID, Infinity],
          ),
        ),
    );

    collectNewTxs(
      newTxsInSession,
      newContentPieces,
      sessionRow,
      signaturesAndIdxs,
      theirKnown,
      firstNewTxIdx,
    );
  }

  async sendNewContentAfter(
    theirKnown: CojsonInternalTypes.CoValueKnownState,
    asDependencyOf?: CojsonInternalTypes.RawCoID,
  ): Promise<void> {
    const coValueRow = await this.makeRequest<StoredCoValueRow | undefined>(
      ({ coValues }) => coValues.index("coValuesById").get(theirKnown.id),
    );

    const allOurSessions = coValueRow
      ? await this.makeRequest<StoredSessionRow[]>(({ sessions }) =>
          sessions.index("sessionsByCoValue").getAll(coValueRow.rowID),
        )
      : [];

    const ourKnown: CojsonInternalTypes.CoValueKnownState = {
      id: theirKnown.id,
      header: !!coValueRow,
      sessions: {},
    };

    const newContentPieces: CojsonInternalTypes.NewContentMessage[] = [
      {
        action: "content",
        id: theirKnown.id,
        header: theirKnown.header ? undefined : coValueRow?.header,
        new: {},
        priority: cojsonInternals.getPriorityFromHeader(coValueRow?.header),
      },
    ];

    await Promise.all(
      allOurSessions.map((sessionRow) =>
        this.handleSessionUpdate(
          sessionRow,
          theirKnown,
          ourKnown,
          newContentPieces,
        ),
      ),
    );

    const dependedOnCoValues = getDependedOnCoValues(
      coValueRow,
      newContentPieces,
      theirKnown,
    );

    await Promise.all(
      dependedOnCoValues.map((dependedOnCoValue) =>
        this.sendNewContentAfter(
          {
            id: dependedOnCoValue,
            header: false,
            sessions: {},
          },
          asDependencyOf || theirKnown.id,
        ),
      ),
    );

    setTimeout(() => {
      this.sendStateMessage(
        {
          action: "known",
          ...ourKnown,
          asDependencyOf,
        },
        "Error sending known state",
      );

      const nonEmptyNewContentPieces = newContentPieces.filter(
        (piece) => piece.header || Object.keys(piece.new).length > 0,
      );

      // console.log(theirKnown.id, nonEmptyNewContentPieces);

      for (const piece of nonEmptyNewContentPieces) {
        this.sendStateMessage(piece, "Error sending new content piece");
      }
    });
  }

  handleLoad(msg: CojsonInternalTypes.LoadMessage) {
    return this.sendNewContentAfter(msg);
  }

  async handleContent(
    msg: CojsonInternalTypes.NewContentMessage,
  ): Promise<void> {
    const coValueRow = await this.makeRequest<StoredCoValueRow | undefined>(
      ({ coValues }) => coValues.index("coValuesById").get(msg.id),
    );
    // TODO suspicious piece of code
    if (!msg.header) {
      console.error("Expected to be sent header first");
      this.sendStateMessage(
        {
          action: "known",
          id: msg.id,
          header: false,
          sessions: {},
          isCorrection: true,
        },
        "Error sending known state",
      );
      return;
    }

    const storedCoValueRowID: number = coValueRow?.rowID
      ? coValueRow.rowID
      : ((await this.makeRequest<IDBValidKey>(
          ({ coValues }) =>
            coValues.put({
              id: msg.id,
              header: msg.header!,
            } satisfies CoValueRow),
          // TODO is it always a number?
        )) as number);

    const allOurSessionsEntries = await this.makeRequest<StoredSessionRow[]>(
      ({ sessions }) =>
        sessions.index("sessionsByCoValue").getAll(storedCoValueRowID),
    );

    const allOurSessions: {
      [sessionID: SessionID]: StoredSessionRow;
    } = Object.fromEntries(
      allOurSessionsEntries.map((row) => [row.sessionID, row]),
    );

    const ourKnown: CojsonInternalTypes.CoValueKnownState = {
      id: msg.id,
      header: true,
      sessions: {},
    };
    let invalidAssumptions = false;

    await Promise.all(
      (Object.keys(msg.new) as SessionID[]).map((sessionID) => {
        const sessionRow = allOurSessions[sessionID];
        if (sessionRow) {
          ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;
        }

        if ((sessionRow?.lastIdx || 0) < (msg.new[sessionID]?.after || 0)) {
          invalidAssumptions = true;
        } else {
          return this.putNewTxs(msg, sessionID, sessionRow, storedCoValueRowID);
        }
      }),
    );

    if (invalidAssumptions) {
      this.sendStateMessage(
        {
          action: "known",
          ...ourKnown,
          isCorrection: invalidAssumptions,
        },
        "Error sending known state",
      );
    }
  }

  private async putNewTxs(
    msg: CojsonInternalTypes.NewContentMessage,
    sessionID: SessionID,
    sessionRow: StoredSessionRow | undefined,
    storedCoValueRowID: number,
  ) {
    const newTransactions = msg.new[sessionID]?.newTransactions || [];

    const actuallyNewOffset =
      (sessionRow?.lastIdx || 0) - (msg.new[sessionID]?.after || 0);

    const actuallyNewTransactions = newTransactions.slice(actuallyNewOffset);

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
      (sessionRow?.lastIdx || 0) + actuallyNewTransactions.length;

    let shouldWriteSignature = false;

    if (newBytesSinceLastSignature > MAX_RECOMMENDED_TX_SIZE) {
      shouldWriteSignature = true;
      newBytesSinceLastSignature = 0;
    }

    const nextIdx = sessionRow?.lastIdx || 0;

    const sessionUpdate = {
      coValue: storedCoValueRowID,
      sessionID: sessionID,
      lastIdx: newLastIdx,
      lastSignature: msg.new[sessionID]!.lastSignature,
      bytesSinceLastSignature: newBytesSinceLastSignature,
    };

    const sessionRowID = await this.makeRequest<number>(({ sessions }) =>
      sessions.put(
        sessionRow?.rowID
          ? {
              rowID: sessionRow.rowID,
              ...sessionUpdate,
            }
          : sessionUpdate,
      ),
    );

    let maybePutRequest;
    if (shouldWriteSignature) {
      maybePutRequest = this.makeRequest(({ signatureAfter }) =>
        signatureAfter.put({
          ses: sessionRowID,
          // TODO: newLastIdx is a misnomer, it's actually more like nextIdx or length
          idx: newLastIdx - 1,
          signature: msg.new[sessionID]!.lastSignature,
        } satisfies SignatureAfterRow),
      );
    } else {
      maybePutRequest = SyncPromise.resolve();
    }

    return maybePutRequest.then(() =>
      Promise.all(
        actuallyNewTransactions.map((newTransaction, i) => {
          return this.makeRequest(({ transactions }) =>
            transactions.add({
              ses: sessionRowID,
              idx: nextIdx + i,
              tx: newTransaction,
            } satisfies TransactionRow),
          );
        }),
      ),
    );
  }

  handleKnown(msg: CojsonInternalTypes.KnownStateMessage) {
    // return this.sendNewContentAfter(msg);
  }

  private sendStateMessage(msg: any, errorMessage: string): Promise<unknown> {
    console.log("sendStateMessage --->>>", msg);
    return this.toLocalNode
      .push(msg)
      .catch((e) => console.error(errorMessage, e));
  }

  handleDone(_msg: CojsonInternalTypes.DoneMessage) {}

  // inTransaction(mode: "readwrite" | "readonly"): {
  //     coValues: IDBObjectStore;
  //     sessions: IDBObjectStore;
  //     transactions: IDBObjectStore;
  //     signatureAfter: IDBObjectStore;
  // } {
  //     const tx = this.db.transaction(
  //         ["coValues", "sessions", "transactions", "signatureAfter"],
  //         mode
  //     );

  //     const txID = lastTx;
  //     lastTx++;
  //     console.time("IndexedDB TX" + txID);

  //     tx.onerror = (event) => {
  //         const target = event.target as unknown as {
  //             error: DOMException;
  //             source?: { name: string };
  //         } | null;
  //         throw new Error(
  //             `Error in transaction (${target?.source?.name}): ${target?.error}`,
  //             { cause: target?.error }
  //         );
  //     };
  //     tx.oncomplete = () => {
  //         console.timeEnd("IndexedDB TX" + txID);
  //     }
  //     const coValues = tx.objectStore("coValues");
  //     const sessions = tx.objectStore("sessions");
  //     const transactions = tx.objectStore("transactions");
  //     const signatureAfter = tx.objectStore("signatureAfter");

  //     return { coValues, sessions, transactions, signatureAfter };
  // }
}

function collectNewTxs(
  newTxsInSession: TransactionRow[],
  newContentPieces: CojsonInternalTypes.NewContentMessage[],
  sessionRow: StoredSessionRow,
  signaturesAndIdxs: SignatureAfterRow[],
  theirKnown: CojsonInternalTypes.CoValueKnownState,
  firstNewTxIdx: number,
) {
  let idx = firstNewTxIdx;

  // console.log(
  //     theirKnown.id,
  //     "newTxInSession",
  //     newTxInSession.length
  // );
  for (const tx of newTxsInSession) {
    let sessionEntry =
      newContentPieces[newContentPieces.length - 1]!.new[sessionRow.sessionID];
    if (!sessionEntry) {
      sessionEntry = {
        after: idx,
        lastSignature: "WILL_BE_REPLACED" as CojsonInternalTypes.Signature,
        newTransactions: [],
      };
      newContentPieces[newContentPieces.length - 1]!.new[sessionRow.sessionID] =
        sessionEntry;
    }

    sessionEntry.newTransactions.push(tx.tx);

    if (signaturesAndIdxs[0] && idx === signaturesAndIdxs[0].idx) {
      sessionEntry.lastSignature = signaturesAndIdxs[0].signature;
      signaturesAndIdxs.shift();
      newContentPieces.push({
        action: "content",
        id: theirKnown.id,
        new: {},
        priority: cojsonInternals.getPriorityFromHeader(undefined),
      });
    } else if (idx === firstNewTxIdx + newTxsInSession.length - 1) {
      sessionEntry.lastSignature = sessionRow.lastSignature;
    }
    idx += 1;
  }
}

function getDependedOnCoValues(
  coValueRow: StoredCoValueRow | undefined,
  newContentPieces: CojsonInternalTypes.NewContentMessage[],
  theirKnown: CojsonInternalTypes.CoValueKnownState,
) {
  return coValueRow?.header.ruleset.type === "group"
    ? newContentPieces
        .flatMap((piece) => Object.values(piece.new))
        .flatMap((sessionEntry) =>
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
                  change.key,
              )
              .filter(
                (key): key is CojsonInternalTypes.RawCoID =>
                  typeof key === "string" && key.startsWith("co_"),
              );
          }),
        )
    : coValueRow?.header.ruleset.type === "ownedByGroup"
      ? [
          coValueRow?.header.ruleset.group,
          ...new Set(
            newContentPieces.flatMap((piece) =>
              Object.keys(piece.new)
                .map((sessionID) =>
                  cojsonInternals.accountOrAgentIDfromSessionID(
                    sessionID as SessionID,
                  ),
                )
                .filter(
                  (accountID): accountID is RawAccountID =>
                    cojsonInternals.isAccountID(accountID) &&
                    accountID !== theirKnown.id,
                ),
            ),
          ),
        ]
      : [];
}
// let lastTx = 0;

// function promised<T>(request: IDBRequest<T>): Promise<T> {
//     return new Promise<T>((resolve, reject) => {
//         request.onsuccess = () => {
//             resolve(request.result);
//         };
//         request.onerror = () => {
//             reject(request.error);
//         };
//     });
// }
