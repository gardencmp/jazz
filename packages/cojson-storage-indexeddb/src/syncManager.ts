import {
  CojsonInternalTypes,
  MAX_RECOMMENDED_TX_SIZE,
  OutgoingSyncQueue,
  SessionID,
  SyncMessage,
  cojsonInternals,
  emptyKnownState,
} from "cojson";
import { IDBClient, MakeRequestFunction } from "./idbClient";
import { SyncPromise } from "./syncPromises.js";
import NewContentMessage = CojsonInternalTypes.NewContentMessage;
import KnownStateMessage = CojsonInternalTypes.KnownStateMessage;
import RawCoID = CojsonInternalTypes.RawCoID;
import { collectNewTxs, getDependedOnCoValues } from "./syncUtils";

type CoValueRow = {
  id: CojsonInternalTypes.RawCoID;
  header: CojsonInternalTypes.CoValueHeader;
};

export type StoredCoValueRow = CoValueRow & { rowID: number };

type SessionRow = {
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

export class SyncManager {
  private readonly toLocalNode: OutgoingSyncQueue;
  private readonly idbClient: IDBClient;

  constructor(idbClient: IDBClient, toLocalNode: OutgoingSyncQueue) {
    this.toLocalNode = toLocalNode;
    this.idbClient = idbClient;
  }

  async handleSyncMessage(msg: SyncMessage) {
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

  async handleSessionUpdate({
    sessionRow,
    theirKnown,
    ourKnown,
    newContentPieces,
  }: {
    sessionRow: StoredSessionRow;
    theirKnown: CojsonInternalTypes.CoValueKnownState;
    ourKnown: CojsonInternalTypes.CoValueKnownState;
    newContentPieces: CojsonInternalTypes.NewContentMessage[];
  }) {
    ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;

    if (sessionRow.lastIdx <= (theirKnown.sessions[sessionRow.sessionID] || 0))
      return;

    const firstNewTxIdx = theirKnown.sessions[sessionRow.sessionID] || 0;

    const signaturesAndIdxs = await this.idbClient.makeRequest<
      SignatureAfterRow[]
    >(({ signatureAfter }: { signatureAfter: IDBObjectStore }) =>
      signatureAfter.getAll(
        IDBKeyRange.bound(
          [sessionRow.rowID, firstNewTxIdx],
          [sessionRow.rowID, Infinity],
        ),
      ),
    );

    const newTxsInSession = await this.idbClient.makeRequest<TransactionRow[]>(
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
  async sendNewContent(
    coValueKnownState: CojsonInternalTypes.CoValueKnownState,
  ): Promise<void> {
    const { contentMessageMap, knownMessageMap } =
      await this.collectCoValueData(coValueKnownState);

    // reverse it to send the top level id the last in the order (hacky - check it explicitly instead or cover well by tests)
    const collectedIds = Object.keys(knownMessageMap).reverse();
    collectedIds.forEach((coId) => {
      this.sendStateMessage(knownMessageMap[coId as RawCoID]);

      const contentMessages = contentMessageMap[coId as RawCoID] || [];
      contentMessages.forEach((msg) => this.sendStateMessage(msg));
    });
  }

  private async collectCoValueData(
    coValueKnownState: CojsonInternalTypes.CoValueKnownState,
    knownMessageMap: Record<RawCoID, KnownStateMessage> = {},
    contentMessageMap: Record<RawCoID, NewContentMessage[]> = {},
    asDependencyOf?: CojsonInternalTypes.RawCoID,
  ) {
    if (knownMessageMap[coValueKnownState.id]) {
      return { knownMessageMap, contentMessageMap };
    }

    const coValueRow = await this.idbClient.getCoValue(coValueKnownState.id);

    if (!coValueRow) {
      const emptyKnownMessage: KnownStateMessage = {
        action: "known",
        ...emptyKnownState(coValueKnownState.id),
      };
      asDependencyOf && (emptyKnownMessage.asDependencyOf = asDependencyOf);
      knownMessageMap[coValueKnownState.id] = emptyKnownMessage;
      return { knownMessageMap, contentMessageMap };
    }

    const allCoValueSessions = await this.idbClient.getCoValueSessions(
      coValueRow.rowID,
    );

    const newCoValueKnownState: CojsonInternalTypes.CoValueKnownState = {
      id: coValueRow.id,
      header: true,
      sessions: {},
    };

    const contentMessages: CojsonInternalTypes.NewContentMessage[] = [
      {
        action: "content",
        id: coValueRow.id,
        header: coValueRow.header,
        new: {},
        priority: cojsonInternals.getPriorityFromHeader(coValueRow.header),
      },
    ];

    await Promise.all(
      allCoValueSessions.map((sessionRow) =>
        this.handleSessionUpdate({
          sessionRow,
          theirKnown: coValueKnownState,
          ourKnown: newCoValueKnownState,
          newContentPieces: contentMessages,
        }),
      ),
    );

    const nonEmptyContentMessages = contentMessages.filter(
      (contentMessage) => Object.keys(contentMessage.new).length > 0,
    );
    const dependedOnCoValuesList = getDependedOnCoValues({
      coValueRow,
      newContentPieces: nonEmptyContentMessages,
    });

    const knownMessage: KnownStateMessage = {
      action: "known",
      ...newCoValueKnownState,
    };
    asDependencyOf && (knownMessage.asDependencyOf = asDependencyOf);
    knownMessageMap[newCoValueKnownState.id] = knownMessage;
    contentMessageMap[newCoValueKnownState.id] = nonEmptyContentMessages;

    await Promise.all(
      dependedOnCoValuesList.map((dependedOnCoValue) =>
        this.collectCoValueData(
          {
            id: dependedOnCoValue,
            header: false,
            sessions: {},
          },
          knownMessageMap,
          contentMessageMap,
          asDependencyOf || coValueRow.id,
        ),
      ),
    );

    return {
      knownMessageMap,
      contentMessageMap,
    };
  }

  handleLoad(msg: CojsonInternalTypes.LoadMessage) {
    return this.sendNewContent(msg);
  }

  async handleContent(
    msg: CojsonInternalTypes.NewContentMessage,
  ): Promise<void | unknown> {
    const coValueRow = await this.idbClient.makeRequest<
      StoredCoValueRow | undefined
    >(({ coValues }) => coValues.index("coValuesById").get(msg.id));
    if (!msg.header && !coValueRow) {
      return this.sendStateMessage({
        action: "known",
        id: msg.id,
        header: false,
        sessions: {},
        isCorrection: true,
      });
    }

    const storedCoValueRowID: number = coValueRow?.rowID
      ? coValueRow.rowID
      : ((await this.idbClient.makeRequest<IDBValidKey>(({ coValues }) =>
          coValues.put({
            id: msg.id,
            header: msg.header!,
          } satisfies CoValueRow),
        )) as number);

    const allOurSessionsEntries = await this.idbClient.makeRequest<
      StoredSessionRow[]
    >(({ sessions }) =>
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
      this.sendStateMessage({
        action: "known",
        ...ourKnown,
        isCorrection: invalidAssumptions,
      });
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

    const sessionRowID = await this.idbClient.makeRequest<number>(
      ({ sessions }) =>
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
      maybePutRequest = this.idbClient.makeRequest(({ signatureAfter }) =>
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
          return this.idbClient.makeRequest(({ transactions }) =>
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

  handleKnown(_msg: CojsonInternalTypes.KnownStateMessage) {
    // No need to process known messages from the local node as IDB storage can't be updated by another peer
  }

  async sendStateMessage(msg: any): Promise<unknown> {
    return this.toLocalNode
      .push(msg)
      .catch((e) =>
        console.error(`Error sending ${msg.action} state, id ${msg.id}`, e),
      );
  }

  handleDone(_msg: CojsonInternalTypes.DoneMessage) {}
}
