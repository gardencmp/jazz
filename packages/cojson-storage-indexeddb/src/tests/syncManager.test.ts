import {
  Mocked,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import {
  CojsonInternalTypes,
  OutgoingSyncQueue,
  SessionID,
  SyncMessage,
} from "cojson";
import { IDBClient } from "../idbClient";
import { SyncManager } from "../syncManager";
import { getDependedOnCoValues } from "../syncUtils";
import { fixtures } from "./fixtureMessages";
import RawCoID = CojsonInternalTypes.RawCoID;
import NewContentMessage = CojsonInternalTypes.NewContentMessage;

vi.mock("../syncUtils");

const coValueIdToLoad = "co_zKwG8NyfZ8GXqcjDHY4NS3SbU2m";
const createEmptyLoadMsg = (id: string) =>
  ({
    action: "load",
    id,
    header: false,
    sessions: {},
  }) as SyncMessage;

const sessionsData = fixtures[coValueIdToLoad].sessionRecords;
const coValueHeader = fixtures[coValueIdToLoad].getContent({ after: 0 }).header;
const incomingContentMessage = fixtures[coValueIdToLoad].getContent({
  after: 0,
}) as SyncMessage;

describe("IDB sync manager", () => {
  let syncManager: SyncManager;
  let queue: OutgoingSyncQueue = {} as unknown as OutgoingSyncQueue;

  const IDBClient = vi.fn();
  IDBClient.prototype.getCoValue = vi.fn();
  IDBClient.prototype.getCoValueSessions = vi.fn();
  IDBClient.prototype.addSessionUpdate = vi.fn();
  IDBClient.prototype.addTransaction = vi.fn();
  IDBClient.prototype.unitOfWork = vi.fn((callback) => Promise.all(callback()));

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
    test("sends empty known message for unknown coValue", async () => {
      const loadMsg = createEmptyLoadMsg(coValueIdToLoad);

      IDBClient.prototype.getCoValue.mockResolvedValueOnce(undefined);

      await syncManager.handleSyncMessage(loadMsg);

      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: false,
        id: coValueIdToLoad,
        sessions: {},
      });
    });

    test("Sends known and content message for known coValue with no sessions", async () => {
      const loadMsg = createEmptyLoadMsg(coValueIdToLoad);

      IDBClient.prototype.getCoValue.mockResolvedValueOnce({
        id: coValueIdToLoad,
        header: coValueHeader,
        rowID: 3,
      });
      IDBClient.prototype.getCoValueSessions.mockResolvedValueOnce([]);

      await syncManager.handleSyncMessage(loadMsg);

      expect(syncManager.sendStateMessage).toBeCalledTimes(2);
      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: true,
        id: coValueIdToLoad,
        sessions: {},
      });
      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "content",
        header: expect.objectContaining({
          type: expect.any(String),
          ruleset: expect.any(Object),
        }),
        id: coValueIdToLoad,
        new: {},
        priority: 0,
      });
    });

    test("Sends both known and content messages when we have new sessions info for the requested coValue ", async () => {
      const loadMsg = createEmptyLoadMsg(coValueIdToLoad);

      IDBClient.prototype.getCoValue.mockResolvedValueOnce({
        id: coValueIdToLoad,
        header: coValueHeader,
        rowID: 3,
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
        async ({ sessionRow, newContentMessages }) => {
          newContentMessages[0]!.new[sessionRow.sessionID] = newTxData;
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

    test("Sends messages for unique coValue dependencies only, leaving out circular dependencies", async () => {
      const loadMsg = createEmptyLoadMsg(coValueIdToLoad);
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
          rowID: 3,
        }),
      );

      IDBClient.prototype.getCoValueSessions.mockResolvedValue([]);

      // Fetch dependencies of the current dependency for the future recursion iterations
      vi.mocked(getDependedOnCoValues).mockImplementation(
        ({ coValueRow }) => dependenciesTreeWithLoop[coValueRow.id] || [],
      );

      await syncManager.handleSyncMessage(loadMsg);

      // We send out pairs (known + content) messages only FOUR times - as many as the coValues number
      // and less than amount of interconnected dependencies to loop through in dependenciesTreeWithLoop
      expect(syncManager.sendStateMessage).toBeCalledTimes(4 * 2);

      const knownExpected = {
        action: "known",
        header: true,
        sessions: {},
      };

      const contentExpected = {
        action: "content",
        header: expect.any(Object),
        new: {},
        priority: 0,
      };

      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(1, {
        ...knownExpected,
        id: dependency3,
        asDependencyOf: coValueIdToLoad,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(2, {
        ...contentExpected,
        id: dependency3,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(3, {
        ...knownExpected,
        id: dependency2,
        asDependencyOf: coValueIdToLoad,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(4, {
        ...contentExpected,
        id: dependency2,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(5, {
        ...knownExpected,
        id: dependency1,
        asDependencyOf: coValueIdToLoad,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(6, {
        ...contentExpected,
        id: dependency1,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(7, {
        ...knownExpected,
        id: coValueIdToLoad,
      });
      expect(syncManager.sendStateMessage).toHaveBeenNthCalledWith(8, {
        ...contentExpected,
        id: coValueIdToLoad,
      });
    });
  });

  describe("Handle content incoming message", () => {
    test("Sends correction message for unknown coValue", async () => {
      IDBClient.prototype.getCoValue.mockResolvedValueOnce(undefined);

      await syncManager.handleSyncMessage({
        ...incomingContentMessage,
        header: undefined,
      } as SyncMessage);

      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: false,
        id: coValueIdToLoad,
        isCorrection: true,
        sessions: {},
      });
    });

    test("Saves new transaction without sending message when IDB has fewer transactions", async () => {
      IDBClient.prototype.getCoValue.mockResolvedValueOnce({
        id: coValueIdToLoad,
        header: coValueHeader,
        rowID: 3,
      });
      IDBClient.prototype.getCoValueSessions.mockResolvedValueOnce([]);
      const msg = {
        ...incomingContentMessage,
        header: undefined,
      } as NewContentMessage;

      await syncManager.handleSyncMessage(msg);

      const incomingTxCount = Object.keys(msg.new).reduce(
        (acc, sessionID) =>
          acc + msg.new[sessionID as SessionID]!.newTransactions.length,
        0,
      );
      expect(IDBClient.prototype.addTransaction).toBeCalledTimes(
        incomingTxCount,
      );

      expect(syncManager.sendStateMessage).not.toBeCalled();
    });

    test("Sends correction message when peer sends a message far ahead of our state due to invalid assumption", async () => {
      IDBClient.prototype.getCoValue.mockResolvedValueOnce({
        id: coValueIdToLoad,
        header: coValueHeader,
        rowID: 3,
      });
      IDBClient.prototype.getCoValueSessions.mockResolvedValueOnce(
        sessionsData,
      );

      const farAheadContentMessage = fixtures[coValueIdToLoad].getContent({
        after: 10000,
      });
      await syncManager.handleSyncMessage(
        farAheadContentMessage as SyncMessage,
      );

      expect(syncManager.sendStateMessage).toBeCalledWith({
        action: "known",
        header: true,
        id: coValueIdToLoad,
        isCorrection: true,
        sessions: expect.any(Object),
      });
    });
  });
});
