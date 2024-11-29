import { CojsonInternalTypes, SessionID } from "cojson";
import { SyncPromise } from "./syncPromises";
import RawCoID = CojsonInternalTypes.RawCoID;
import Transaction = CojsonInternalTypes.Transaction;
import Signature = CojsonInternalTypes.Signature;

export type CoValueRow = {
  id: CojsonInternalTypes.RawCoID;
  header: CojsonInternalTypes.CoValueHeader;
};

export type StoredCoValueRow = CoValueRow & { rowID: number };

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

export type SessionRow = {
  coValue: number;
  sessionID: SessionID;
  lastIdx: number;
  lastSignature: CojsonInternalTypes.Signature;
  bytesSinceLastSignature?: number;
};

export type StoredSessionRow = SessionRow & { rowID: number };

export class IDBClient {
  private db;

  currentTx:
    | {
        id: number;
        tx: IDBTransaction;
        stores: {
          coValues: IDBObjectStore;
          sessions: IDBObjectStore;
          transactions: IDBObjectStore;
          signatureAfter: IDBObjectStore;
        };
        startedAt: number;
        pendingRequests: ((txEntry: {
          stores: {
            coValues: IDBObjectStore;
            sessions: IDBObjectStore;
            transactions: IDBObjectStore;
            signatureAfter: IDBObjectStore;
          };
        }) => void)[];
      }
    | undefined;

  currentTxID = 0;

  constructor(db: IDBDatabase) {
    this.db = db;
  }

  makeRequest<T>(
    handler: (stores: {
      coValues: IDBObjectStore;
      sessions: IDBObjectStore;
      transactions: IDBObjectStore;
      signatureAfter: IDBObjectStore;
    }) => IDBRequest,
  ): SyncPromise<T> {
    return new SyncPromise((resolve, reject) => {
      let txEntry = this.currentTx;

      const requestEntry = ({
        stores,
      }: {
        stores: {
          coValues: IDBObjectStore;
          sessions: IDBObjectStore;
          transactions: IDBObjectStore;
          signatureAfter: IDBObjectStore;
        };
      }) => {
        const request = handler(stores);
        request.onerror = () => {
          console.error("Error in request", request.error);
          this.currentTx = undefined;
          reject(request.error);
        };
        request.onsuccess = () => {
          const value = request.result as T;
          resolve(value);

          const next = txEntry!.pendingRequests.shift();

          if (next) {
            next({ stores });
          } else {
            if (this.currentTx === txEntry) {
              this.currentTx = undefined;
            }
          }
        };
      };

      // Transaction batching
      if (!txEntry || performance.now() - txEntry.startedAt > 20) {
        const tx = this.db.transaction(
          ["coValues", "sessions", "transactions", "signatureAfter"],
          "readwrite",
        );
        txEntry = {
          id: this.currentTxID++,
          tx,
          stores: {
            coValues: tx.objectStore("coValues"),
            sessions: tx.objectStore("sessions"),
            transactions: tx.objectStore("transactions"),
            signatureAfter: tx.objectStore("signatureAfter"),
          },
          startedAt: performance.now(),
          pendingRequests: [],
        };

        this.currentTx = txEntry;

        requestEntry(txEntry);
      } else {
        txEntry.pendingRequests.push(requestEntry);
      }
    });
  }

  async getCoValue(coValueId: RawCoID): Promise<StoredCoValueRow | undefined> {
    return this.makeRequest<StoredCoValueRow | undefined>(({ coValues }) =>
      coValues.index("coValuesById").get(coValueId),
    );
  }

  async getCoValueSessions(coValueRowId: number): Promise<StoredSessionRow[]> {
    return this.makeRequest<StoredSessionRow[]>(({ sessions }) =>
      sessions.index("sessionsByCoValue").getAll(coValueRowId),
    );
  }

  async getNewTransactionInSession(
    sessionRow: StoredSessionRow,
    firstNewTxIdx: number,
  ): Promise<TransactionRow[]> {
    return this.makeRequest<TransactionRow[]>(({ transactions }) =>
      transactions.getAll(
        IDBKeyRange.bound(
          [sessionRow.rowID, firstNewTxIdx],
          [sessionRow.rowID, Infinity],
        ),
      ),
    );
  }

  async getSignatures(
    sessionRow: StoredSessionRow,
    firstNewTxIdx: number,
  ): Promise<SignatureAfterRow[]> {
    return this.makeRequest<SignatureAfterRow[]>(
      ({ signatureAfter }: { signatureAfter: IDBObjectStore }) =>
        signatureAfter.getAll(
          IDBKeyRange.bound(
            [sessionRow.rowID, firstNewTxIdx],
            [sessionRow.rowID, Infinity],
          ),
        ),
    );
  }

  async addCoValue(
    msg: CojsonInternalTypes.NewContentMessage,
  ): Promise<number> {
    if (!msg.header) {
      throw new Error("Header is required, coId: " + msg.id);
    }

    return (await this.makeRequest<IDBValidKey>(({ coValues }) =>
      coValues.put({
        id: msg.id,
        header: msg.header!,
      } satisfies CoValueRow),
    )) as number;
  }

  async addSessionUpdate(
    sessionRow: StoredSessionRow | undefined,
    sessionUpdate: SessionRow,
  ): Promise<number> {
    return this.makeRequest<number>(({ sessions }) =>
      sessions.put(
        sessionRow?.rowID
          ? {
              rowID: sessionRow.rowID,
              ...sessionUpdate,
            }
          : sessionUpdate,
      ),
    );
  }

  addTransaction(
    sessionRowID: number,
    idx: number,
    newTransaction: Transaction,
  ) {
    return this.makeRequest(({ transactions }) =>
      transactions.add({
        ses: sessionRowID,
        idx,
        tx: newTransaction,
      } satisfies TransactionRow),
    );
  }

  addSignatureAfter({
    sessionRowID,
    idx,
    signature,
  }: { sessionRowID: number; idx: number; signature: Signature }) {
    return this.makeRequest(({ signatureAfter }) =>
      signatureAfter.put({
        ses: sessionRowID,
        idx,
        signature,
      } satisfies SignatureAfterRow),
    );
  }
}
