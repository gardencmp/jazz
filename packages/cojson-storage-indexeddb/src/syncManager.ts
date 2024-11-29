import {
  CojsonInternalTypes,
  MAX_RECOMMENDED_TX_SIZE,
  OutgoingSyncQueue,
  SessionID,
  SyncMessage,
  cojsonInternals,
  emptyKnownState,
} from "cojson";
import { IDBClient, StoredSessionRow } from "./idbClient";
import { SyncPromise } from "./syncPromises.js";
import { collectNewTxs, getDependedOnCoValues } from "./syncUtils";
import NewContentMessage = CojsonInternalTypes.NewContentMessage;
import KnownStateMessage = CojsonInternalTypes.KnownStateMessage;
import RawCoID = CojsonInternalTypes.RawCoID;

type OutputMessageMap = Record<
  RawCoID,
  { knownMessage: KnownStateMessage; contentMessages?: NewContentMessage[] }
>;

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
    peerKnownState,
    newContentMessages,
  }: {
    sessionRow: StoredSessionRow;
    peerKnownState: CojsonInternalTypes.CoValueKnownState;
    newContentMessages: CojsonInternalTypes.NewContentMessage[];
  }) {
    if (
      sessionRow.lastIdx <= (peerKnownState.sessions[sessionRow.sessionID] || 0)
    )
      return;

    const firstNewTxIdx = peerKnownState.sessions[sessionRow.sessionID] || 0;
    const signaturesAndIdxs = await this.idbClient.getSignatures(
      sessionRow,
      firstNewTxIdx,
    );
    const newTxsInSession = await this.idbClient.getNewTransactionInSession(
      sessionRow,
      firstNewTxIdx,
    );

    collectNewTxs(
      newTxsInSession,
      newContentMessages,
      sessionRow,
      signaturesAndIdxs,
      peerKnownState,
      firstNewTxIdx,
    );
  }

  async sendNewContent(
    coValueKnownState: CojsonInternalTypes.CoValueKnownState,
  ): Promise<void> {
    const outputMessages: OutputMessageMap =
      await this.collectCoValueData(coValueKnownState);

    // reverse it to send the top level id the last in the order
    const collectedMessages = Object.values(outputMessages).reverse();
    collectedMessages.forEach(({ knownMessage, contentMessages }) => {
      this.sendStateMessage(knownMessage);

      contentMessages?.length &&
        contentMessages.forEach((msg) => this.sendStateMessage(msg));
    });
  }

  private async collectCoValueData(
    peerKnownState: CojsonInternalTypes.CoValueKnownState,
    messageMap: OutputMessageMap = {},
    asDependencyOf?: CojsonInternalTypes.RawCoID,
  ) {
    if (messageMap[peerKnownState.id]) {
      return messageMap;
    }

    const coValueRow = await this.idbClient.getCoValue(peerKnownState.id);

    if (!coValueRow) {
      const emptyKnownMessage: KnownStateMessage = {
        action: "known",
        ...emptyKnownState(peerKnownState.id),
      };
      asDependencyOf && (emptyKnownMessage.asDependencyOf = asDependencyOf);
      messageMap[peerKnownState.id] = { knownMessage: emptyKnownMessage };
      return messageMap;
    }

    const allCoValueSessions = await this.idbClient.getCoValueSessions(
      coValueRow.rowID,
    );

    const newCoValueKnownState: CojsonInternalTypes.CoValueKnownState = {
      id: coValueRow.id,
      header: true,
      sessions: {},
    };

    const newContentMessages: CojsonInternalTypes.NewContentMessage[] = [
      {
        action: "content",
        id: coValueRow.id,
        header: coValueRow.header,
        new: {},
        priority: cojsonInternals.getPriorityFromHeader(coValueRow.header),
      },
    ];

    await Promise.all(
      allCoValueSessions.map((sessionRow) => {
        newCoValueKnownState.sessions[sessionRow.sessionID] =
          sessionRow.lastIdx;
        // Collect new sessions data into newContentMessages
        return this.handleSessionUpdate({
          sessionRow,
          peerKnownState,
          newContentMessages,
        });
      }),
    );

    const nonEmptyContentMessages = newContentMessages.filter(
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
    messageMap[newCoValueKnownState.id] = {
      knownMessage: knownMessage,
      contentMessages: nonEmptyContentMessages,
    };

    await Promise.all(
      dependedOnCoValuesList.map((dependedOnCoValue) =>
        this.collectCoValueData(
          {
            id: dependedOnCoValue,
            header: false,
            sessions: {},
          },
          messageMap,
          asDependencyOf || coValueRow.id,
        ),
      ),
    );

    return messageMap;
  }

  handleLoad(msg: CojsonInternalTypes.LoadMessage) {
    return this.sendNewContent(msg);
  }

  async handleContent(
    msg: CojsonInternalTypes.NewContentMessage,
  ): Promise<void | unknown> {
    const coValueRow = await this.idbClient.getCoValue(msg.id);

    // We have no info about coValue header
    const invalidAssumptionOnHeaderPresence = !msg.header && !coValueRow;

    if (invalidAssumptionOnHeaderPresence) {
      return this.sendStateMessage({
        action: "known",
        id: msg.id,
        header: false,
        sessions: {},
        isCorrection: true,
      });
    }

    const storedCoValueRowID: number = coValueRow
      ? coValueRow.rowID
      : await this.idbClient.addCoValue(msg);

    const allOurSessionsEntries =
      await this.idbClient.getCoValueSessions(storedCoValueRowID);

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

    const sessionRowID: number = await this.idbClient.addSessionUpdate(
      sessionRow,
      sessionUpdate,
    );

    let maybePutRequest;
    if (shouldWriteSignature) {
      maybePutRequest = this.idbClient.addSignatureAfter({
        sessionRowID,
        idx: newLastIdx - 1,
        signature: msg.new[sessionID]!.lastSignature,
      });
    } else {
      maybePutRequest = SyncPromise.resolve();
    }

    return maybePutRequest.then(() =>
      Promise.all(
        actuallyNewTransactions.map((newTransaction, i) => {
          return this.idbClient.addTransaction(
            sessionRowID,
            nextIdx + i,
            newTransaction,
          );
        }),
      ),
    );
  }

  handleKnown(_msg: KnownStateMessage) {
    // We don't intend to use IndexedDB itself as a synchronisation mechanism, so we can ignore the known messages
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
