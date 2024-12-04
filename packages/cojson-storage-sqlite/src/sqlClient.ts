import { Database as DatabaseT } from "better-sqlite3";
import { CojsonInternalTypes, OutgoingSyncQueue, SessionID } from "cojson";
import RawCoID = CojsonInternalTypes.RawCoID;
import Signature = CojsonInternalTypes.Signature;
import Transaction = CojsonInternalTypes.Transaction;

export type RawCoValueRow = {
  id: CojsonInternalTypes.RawCoID;
  header: string;
};

export type CoValueRow = {
  id: CojsonInternalTypes.RawCoID;
  header: CojsonInternalTypes.CoValueHeader;
};

export type StoredCoValueRow = CoValueRow & { rowID: number };

export type SessionRow = {
  coValue: number;
  sessionID: SessionID;
  lastIdx: number;
  lastSignature: CojsonInternalTypes.Signature;
  bytesSinceLastSignature?: number;
};

export type StoredSessionRow = SessionRow & { rowID: number };

export type RawTransactionRow = {
  ses: number;
  idx: number;
  tx: string;
};

export type TransactionRow = {
  ses: number;
  idx: number;
  tx: CojsonInternalTypes.Transaction;
};

export type SignatureAfterRow = {
  ses: number;
  idx: number;
  signature: CojsonInternalTypes.Signature;
};

export class SQLiteClient {
  private readonly db: DatabaseT;
  private readonly toLocalNode: OutgoingSyncQueue;

  constructor(db: DatabaseT, toLocalNode: OutgoingSyncQueue) {
    this.db = db;
    this.toLocalNode = toLocalNode;
  }

  async getCoValue(coValueId: RawCoID): Promise<StoredCoValueRow | undefined> {
    const coValueRow = this.db
      .prepare(`SELECT * FROM coValues WHERE id = ?`)
      .get(coValueId) as RawCoValueRow & { rowID: number };

    if (!coValueRow) return;

    try {
      const parsedHeader = (coValueRow?.header &&
        JSON.parse(coValueRow.header)) as CojsonInternalTypes.CoValueHeader;

      return {
        ...coValueRow,
        header: parsedHeader,
      };
    } catch (e) {
      console.warn(coValueId, "Invalid JSON in header", e, coValueRow?.header);
      return;
    }
  }

  async getCoValueSessions(coValueRowId: number): Promise<StoredSessionRow[]> {
    return this.db
      .prepare<number>(`SELECT * FROM sessions WHERE coValue = ?`)
      .all(coValueRowId) as StoredSessionRow[];
  }

  async getNewTransactionInSession(
    sessionRowId: number,
    firstNewTxIdx: number,
  ): Promise<TransactionRow[]> {
    const txs = this.db
      .prepare<[number, number]>(
        `SELECT * FROM transactions WHERE ses = ? AND idx >= ?`,
      )
      .all(sessionRowId, firstNewTxIdx) as RawTransactionRow[];

    try {
      return txs.map((transactionRow) => ({
        ...transactionRow,
        tx: JSON.parse(transactionRow.tx) as Transaction,
      }));
    } catch (e) {
      console.warn("Invalid JSON in transaction", e);
      return [];
    }
  }

  async getSignatures(
    sessionRowId: number,
    firstNewTxIdx: number,
  ): Promise<SignatureAfterRow[]> {
    return this.db
      .prepare<[number, number]>(
        `SELECT * FROM signatureAfter WHERE ses = ? AND idx >= ?`,
      )
      .all(sessionRowId, firstNewTxIdx) as SignatureAfterRow[];
  }

  async addCoValue(
    msg: CojsonInternalTypes.NewContentMessage,
  ): Promise<number> {
    return this.db
      .prepare<[CojsonInternalTypes.RawCoID, string]>(
        `INSERT INTO coValues (id, header) VALUES (?, ?)`,
      )
      .run(msg.id, JSON.stringify(msg.header)).lastInsertRowid as number;
  }

  async addSessionUpdate({
    sessionUpdate,
    sessionRow,
  }: {
    sessionUpdate: SessionRow;
    sessionRow?: StoredSessionRow;
  }): Promise<number> {
    return (
      this.db
        .prepare<[number, string, number, string, number | undefined]>(
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
        ) as { rowID: number }
    ).rowID;
  }

  addTransaction(
    sessionRowID: number,
    nextIdx: number,
    newTransaction: Transaction,
  ) {
    this.db
      .prepare<[number, number, string]>(
        `INSERT INTO transactions (ses, idx, tx) VALUES (?, ?, ?)`,
      )
      .run(sessionRowID, nextIdx, JSON.stringify(newTransaction));
  }

  async addSignatureAfter({
    sessionRowID,
    idx,
    signature,
  }: { sessionRowID: number; idx: number; signature: Signature }) {
    return this.db
      .prepare<[number, number, string]>(
        `INSERT INTO signatureAfter (ses, idx, signature) VALUES (?, ?, ?)`,
      )
      .run(sessionRowID, idx, signature);
  }

  async unitOfWork(operationsCallback: () => any[]) {
    this.db.transaction(operationsCallback)();
  }
}
