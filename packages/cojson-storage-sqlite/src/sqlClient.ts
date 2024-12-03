import { Database as DatabaseT } from "better-sqlite3";
import {
  CojsonInternalTypes,
  MAX_RECOMMENDED_TX_SIZE,
  OutgoingSyncQueue,
  RawAccountID,
  SessionID,
  cojsonInternals,
} from "cojson";
import RawCoID = CojsonInternalTypes.RawCoID;
import Signature = CojsonInternalTypes.Signature;
import Transaction = CojsonInternalTypes.Transaction;

export type CoValueRow = {
  id: CojsonInternalTypes.RawCoID;
  header: string;
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

export type TransactionRow = {
  ses: number;
  idx: number;
  tx: string;
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
    return this.db
      .prepare(`SELECT * FROM coValues WHERE id = ?`)
      .get(coValueId) as StoredCoValueRow;
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
    return this.db
      .prepare<[number, number]>(
        `SELECT * FROM transactions WHERE ses = ? AND idx >= ?`,
      )
      .all(sessionRowId, firstNewTxIdx) as TransactionRow[];
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

  async addSessionUpdate(sessionUpdate: SessionRow): Promise<number> {
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
}
