import {
  type IncomingSyncStream,
  type OutgoingSyncQueue,
  type Peer,
  cojsonInternals,
} from "cojson";
import { SyncManager } from "cojson-storage";
import { IDBClient } from "./idbClient.js";

export class IDBNode {
  private readonly dbClient: IDBClient;
  private readonly syncManager: SyncManager;

  constructor(
    db: IDBDatabase,
    fromLocalNode: IncomingSyncStream,
    toLocalNode: OutgoingSyncQueue,
  ) {
    this.dbClient = new IDBClient(db);
    this.syncManager = new SyncManager(this.dbClient, toLocalNode);

    const processMessages = async () => {
      for await (const msg of fromLocalNode) {
        try {
          if (msg === "Disconnected" || msg === "PingTimeout") {
            throw new Error("Unexpected Disconnected message");
          }
          await this.syncManager.handleSyncMessage(msg);
        } catch (e) {
          console.error(
            new Error(
              `Error reading from localNode, handling msg\n\n${JSON.stringify(
                msg,
                (k, v) =>
                  k === "changes" || k === "encryptedChanges"
                    ? `${v.slice(0, 20)}...`
                    : v,
              )}`,
              { cause: e },
            ),
          );
        }
      }
    };

    processMessages().catch((e) =>
      console.error("Error in processMessages in IndexedDB", e),
    );
  }

  static async asPeer(
    {
      trace,
      localNodeName = "local",
    }: { trace?: boolean; localNodeName?: string } | undefined = {
      localNodeName: "local",
    },
  ): Promise<Peer> {
    const [localNodeAsPeer, storageAsPeer] = cojsonInternals.connectedPeers(
      localNodeName,
      "indexedDB",
      {
        peer1role: "client",
        peer2role: "storage",
        trace,
        crashOnClose: true,
      },
    );

    await IDBNode.open(localNodeAsPeer.incoming, localNodeAsPeer.outgoing);

    return { ...storageAsPeer, priority: 100 };
  }

  static async open(
    fromLocalNode: IncomingSyncStream,
    toLocalNode: OutgoingSyncQueue,
  ) {
    const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("jazz-storage", 4);
      request.onerror = () => {
        reject(request.error);
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onupgradeneeded = async (ev) => {
        const db = request.result;
        if (ev.oldVersion === 0) {
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
          sessions.createIndex("uniqueSessions", ["coValue", "sessionID"], {
            unique: true,
          });

          db.createObjectStore("transactions", {
            keyPath: ["ses", "idx"],
          });
        }
        if (ev.oldVersion <= 1) {
          db.createObjectStore("signatureAfter", {
            keyPath: ["ses", "idx"],
          });
        }
      };
    });

    return new IDBNode(await dbPromise, fromLocalNode, toLocalNode);
  }
}
