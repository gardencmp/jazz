import { CojsonInternalTypes, SessionID } from "cojson";
import RawCoID = CojsonInternalTypes.RawCoID;
import Transaction = CojsonInternalTypes.Transaction;
import Signature = CojsonInternalTypes.Signature;

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

export interface DBClientInterface {
  getCoValue(
    coValueId: RawCoID,
  ): Promise<StoredCoValueRow | undefined> | StoredCoValueRow | undefined;

  getCoValueSessions(
    coValueRowId: number,
  ): Promise<StoredSessionRow[]> | StoredSessionRow[];

  getNewTransactionInSession(
    sessionRowId: number,
    firstNewTxIdx: number,
  ): Promise<TransactionRow[]> | TransactionRow[];

  getSignatures(
    sessionRowId: number,
    firstNewTxIdx: number,
  ): Promise<SignatureAfterRow[]> | SignatureAfterRow[];

  addCoValue(
    msg: CojsonInternalTypes.NewContentMessage,
  ): Promise<number> | number;

  addSessionUpdate({
    sessionUpdate,
    sessionRow,
  }: {
    sessionUpdate: SessionRow;
    sessionRow?: StoredSessionRow;
  }): Promise<number> | number;

  addTransaction(
    sessionRowID: number,
    idx: number,
    newTransaction: Transaction,
  ): Promise<number> | void | unknown;

  addSignatureAfter({
    sessionRowID,
    idx,
    signature,
  }: {
    sessionRowID: number;
    idx: number;
    signature: Signature;
  }): Promise<number> | void | unknown;

  unitOfWork(operationsCallback: () => unknown[]): Promise<unknown> | void;
}
