import { SyncPromise } from "./syncPromises";

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
          // TODO: recover pending requests in new tx
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

        // console.time("IndexedDB TX" + txEntry.id);

        // txEntry.tx.oncomplete = () => {
        //     console.timeEnd("IndexedDB TX" + txEntry!.id);
        // };

        this.currentTx = txEntry;

        requestEntry(txEntry);
      } else {
        txEntry.pendingRequests.push(requestEntry);
        // console.log(
        //     "Queued request in TX " + txEntry.id,
        //     txEntry.pendingRequests.length
        // );
      }
    });
  }
}
