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
import RawCoID = CojsonInternalTypes.RawCoID;

vi.mock("../syncUtils");

const coValueIdToLoad = "co_zKwG8NyfZ8GXqcjDHY4NS3SbU2m";
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
  IDBClient.prototype.getCoValue = vi.fn();
  IDBClient.prototype.getCoValueSessions = vi.fn();

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

  test("Incoming known messages are not processed", async () => {
    await syncManager.handleSyncMessage({ action: "known" } as SyncMessage);
    expect(syncManager.sendStateMessage).not.toBeCalled();
  });

  describe("Handle load incoming message", () => {
    const sessionsData = fixtures[coValueIdToLoad].sessionRecords;
    const coValueHeader = fixtures[coValueIdToLoad].content.header;

    test("sends empty known message for unknown coValue", async () => {
      const loadMsg = getEmptyLoadMsg(coValueIdToLoad);

      IDBClient.prototype.getCoValue.mockResolvedValueOnce(undefined);

      await syncManager.handleSyncMessage(loadMsg);

      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: false,
        id: coValueIdToLoad,
        sessions: {},
      });
    });

    test("Sends one known message when we have no more sessions info for the requested coValue", async () => {
      const loadMsg = getEmptyLoadMsg(coValueIdToLoad);

      IDBClient.prototype.getCoValue.mockResolvedValueOnce({
        id: coValueIdToLoad,
        header: coValueHeader,
        rawId: 3,
      });
      IDBClient.prototype.getCoValueSessions.mockResolvedValueOnce([]);

      await syncManager.handleSyncMessage(loadMsg);

      expect(syncManager.sendStateMessage).toBeCalledTimes(1);
      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: true,
        id: coValueIdToLoad,
        sessions: {},
      });
    });

    test("Sends both known and content messages when we have new sessions info for the requested coValue ", async () => {
      const loadMsg = getEmptyLoadMsg(coValueIdToLoad);

      IDBClient.prototype.getCoValue.mockResolvedValueOnce({
        id: coValueIdToLoad,
        header: coValueHeader,
        rawId: 3,
      });
      IDBClient.prototype.getCoValueSessions.mockResolvedValueOnce(
        sessionsData,
      );

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
        id: coValueIdToLoad,
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
        id: coValueIdToLoad,
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

    test.only("Sends messages belonging to unique dependencies only, leaving out circular dependencies", async () => {
      const loadMsg = getEmptyLoadMsg(coValueIdToLoad);
      const dependency1 = "co_zMKhQJs5rAeGjta3JX2qEdBS6hS";
      const dependency2 = "co_zP51HdyAVCuRY9ptq5iu8DhMyAb";
      const dependency3 = "co_zGyBniuJmKkcirCKYrccWpjQEFY";
      const dependenciesTreeWithLoop: Record<RawCoID, RawCoID[]> = {
        [coValueIdToLoad]: [dependency1, dependency2],
        [dependency1]: [],
        [dependency2]: [coValueIdToLoad, dependency3],
        [dependency3]: [dependency1],
      };

      IDBClient.prototype.getCoValue.mockImplementation(
        (coValueId: RawCoID) => ({
          id: coValueId,
          header: coValueHeader,
          rawId: 3,
        }),
      );

      // No new data will be returned for coValue and dependencies as it's not a goal of this test
      IDBClient.prototype.getCoValueSessions.mockResolvedValue([]);

      vi.mocked(getDependedOnCoValues).mockImplementation(
        ({ coValueRow }) => dependenciesTreeWithLoop[coValueRow.id] || [],
      );

      await syncManager.handleSyncMessage(loadMsg);

      // We send out known message only FOUR times - as many as the coValues number
      // and less than amount of interconnected dependencies to loop through in dependenciesTreeWithLoop
      expect(syncManager.sendStateMessage).toBeCalledTimes(4);

      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(1, {
        action: "known",
        header: true,
        id: dependency3,
        sessions: {},
        asDependencyOf: coValueIdToLoad,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(2, {
        action: "known",
        header: true,
        id: dependency2,
        sessions: {},
        asDependencyOf: coValueIdToLoad,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(3, {
        action: "known",
        header: true,
        id: dependency1,
        sessions: {},
        asDependencyOf: coValueIdToLoad,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(4, {
        action: "known",
        header: true,
        id: coValueIdToLoad,
        sessions: {},
      });
    });
  });
});
