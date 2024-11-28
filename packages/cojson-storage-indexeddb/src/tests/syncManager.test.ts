import {
  Mocked,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import { CojsonInternalTypes, OutgoingSyncQueue, SyncMessage } from "cojson";
import { IDBClient } from "../idbClient";
import { SyncManager } from "../syncManager";
import { getDependedOnCoValues } from "../syncUtils";
import { fixtures } from "./fixtureMessages";

vi.mock("../syncUtils");

const coValueToLoad = "co_zKwG8NyfZ8GXqcjDHY4NS3SbU2m";
const getEmptyLoadMsg = (id: string) =>
  ({
    action: "load",
    id,
    header: false,
    sessions: {},
  }) as SyncMessage;

describe("IDB sync manager", () => {
  let syncManager: SyncManager;
  let queue: OutgoingSyncQueue = {} as unknown as OutgoingSyncQueue;

  const IDBClient = vi.fn();
  IDBClient.prototype.makeRequest = vi.fn();

  beforeEach(async () => {
    const idbClient = new IDBClient() as unknown as Mocked<IDBClient>;
    syncManager = new SyncManager(idbClient, queue);
    syncManager.sendStateMessage = vi.fn();

    // No dependencies found
    vi.mocked(getDependedOnCoValues).mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("incoming known messages are not processed", async () => {
    await syncManager.handleSyncMessage({ action: "known" } as SyncMessage);
    expect(syncManager.sendStateMessage).not.toBeCalled();
  });

  describe("Handle load incoming message", () => {
    const sessionsData = fixtures[coValueToLoad].sessionRecords;
    const coValueHeader = fixtures[coValueToLoad].content.header;

    test("sends empty known message for unknown coValue", async () => {
      const loadMsg = getEmptyLoadMsg(coValueToLoad);

      // makeRequest call in IDBClient.collectCoValueData to fetch a coValue record
      IDBClient.prototype.makeRequest.mockResolvedValueOnce(undefined);

      await syncManager.handleSyncMessage(loadMsg);

      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: false,
        id: coValueToLoad,
        sessions: {},
      });
    });

    test("sends one known message when we have no more sessions info for the requested coValue", async () => {
      const loadMsg = getEmptyLoadMsg(coValueToLoad);

      // first makeRequest call in IDBClient.collectCoValueData to fetch a coValue record
      IDBClient.prototype.makeRequest.mockResolvedValueOnce({
        id: coValueToLoad,
        header: coValueHeader,
        rawId: 3,
      });
      // second makeRequest call in IDBClient.collectCoValueData to fetch session records
      IDBClient.prototype.makeRequest.mockResolvedValueOnce([]);

      await syncManager.handleSyncMessage(loadMsg);

      expect(syncManager.sendStateMessage).toBeCalledTimes(1);
      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: true,
        id: coValueToLoad,
        sessions: {},
      });
    });

    test("sends both known and content messages when we have new sessions info for the requested coValue ", async () => {
      const loadMsg = getEmptyLoadMsg(coValueToLoad);

      // 1st makeRequest call in IDBClient.collectCoValueData to fetch a coValue record
      IDBClient.prototype.makeRequest.mockResolvedValueOnce({
        id: coValueToLoad,
        header: coValueHeader,
        rawId: 3,
      });
      // 2nd makeRequest call in IDBClient.collectCoValueData to fetch session records
      IDBClient.prototype.makeRequest.mockResolvedValueOnce(sessionsData);

      const newTxData = {
        newTransactions: [
          {
            privacy: "trusting",
            madeAt: 1732368535089,
            changes: "",
          } as CojsonInternalTypes.Transaction,
        ],
        after: 0,
        lastSignature: "signature_z111",
      } satisfies CojsonInternalTypes.SessionNewContent;

      // mock content data combined with session updates
      syncManager.handleSessionUpdate = vi.fn(
        async ({ sessionRow, newContentPieces, ourKnown }) => {
          newContentPieces[0]!.new[sessionRow.sessionID] = newTxData;
          ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;
        },
      );

      await syncManager.handleSyncMessage(loadMsg);

      expect(syncManager.sendStateMessage).toBeCalledTimes(2);

      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(1, {
        action: "known",
        header: true,
        id: coValueToLoad,
        sessions: sessionsData.reduce(
          (acc, sessionRow) => ({
            ...acc,
            [sessionRow.sessionID]: sessionRow.lastIdx,
          }),
          {},
        ),
      });

      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(2, {
        action: "content",
        header: coValueHeader,
        id: coValueToLoad,
        new: sessionsData.reduce(
          (acc, sessionRow) => ({
            ...acc,
            [sessionRow.sessionID]: {
              after: expect.any(Number),
              lastSignature: expect.any(String),
              newTransactions: expect.any(Array),
            },
          }),
          {},
        ),
        priority: 0,
      });
    });
  });
});
