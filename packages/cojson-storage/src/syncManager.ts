import {
  CojsonInternalTypes,
  MAX_RECOMMENDED_TX_SIZE,
  OutgoingSyncQueue,
  SessionID,
  SyncMessage,
  cojsonInternals,
  emptyDataMessage,
  emptyKnownState,
  unknownDataMessage,
} from "cojson";
import { collectNewTxs, getDependedOnCoValues } from "./syncUtils.js";
import {
  DBClientInterface,
  StoredCoValueRow,
  StoredSessionRow,
} from "./types.js";
import NewContentMessage = CojsonInternalTypes.NewContentMessage;
import KnownStateMessage = CojsonInternalTypes.KnownStateMessage;
import DataMessage = CojsonInternalTypes.DataMessage;
import PushMessage = CojsonInternalTypes.PushMessage;
import RawCoID = CojsonInternalTypes.RawCoID;

type OutputMessageMap = Record<
  RawCoID,
  {
    knownMessage: KnownStateMessage;
    contentMessages?: NewContentMessage[];
    dataMessages?: DataMessage[];
  }
>;

export class SyncManager {
  private readonly toLocalNode: OutgoingSyncQueue;
  private readonly dbClient: DBClientInterface;

  constructor(dbClient: DBClientInterface, toLocalNode: OutgoingSyncQueue) {
    this.toLocalNode = toLocalNode;
    this.dbClient = dbClient;
  }

  async handleSyncMessage(msg: SyncMessage) {
    switch (msg.action) {
      case "pull":
        return this.handlePull(msg);
      case "data":
        return this.handleData(msg);
      case "push":
        return this.handlePush(msg);
      case "known":
        return this.handleKnown(msg);
      case "done":
        return this.handleDone(msg);
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

    const signaturesAndIdxs = await this.dbClient.getSignatures(
      sessionRow.rowID,
      firstNewTxIdx,
    );

    const newTxsInSession = await this.dbClient.getNewTransactionInSession(
      sessionRow.rowID,
      firstNewTxIdx,
    );

    collectNewTxs({
      newTxsInSession,
      newContentMessages,
      sessionRow,
      signaturesAndIdxs,
      peerKnownState,
      firstNewTxIdx,
    });
  }

  // actually, it's a handlePull method
  async sendNewContent(
    coValueKnownState: CojsonInternalTypes.CoValueKnownState,
  ): Promise<void> {
    const outputMessages: OutputMessageMap =
      await this.collectCoValueData(coValueKnownState);

    // reverse it to send the top level id the last in the order
    const collectedMessages = Object.values(outputMessages).reverse();
    collectedMessages.forEach(({ knownMessage, contentMessages }) => {
      // this.sendStateMessage(knownMessage);
      // temporary ugly patch to make it work with "data" and "pull" actions
      if (!knownMessage.header) {
        this.sendStateMessage(unknownDataMessage(knownMessage.id));

        if (coValueKnownState.header) {
          this.sendStateMessage({ ...knownMessage, action: "pull" });
        }

        return;
      }

      const dataMsg = contentMessages?.length
        ? {
            ...contentMessages[0],
            action: "data",
            asDependencyOf: knownMessage.asDependencyOf,
          }
        : { ...emptyDataMessage(knownMessage.id) };

      this.sendStateMessage(dataMsg);
      // contentMessages?.length &&
      //   contentMessages.forEach((msg) => {
      //     this.sendStateMessage(msg);
      //   });
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

    const coValueRow = await this.dbClient.getCoValue(peerKnownState.id);

    if (!coValueRow) {
      const emptyKnownMessage: KnownStateMessage = {
        action: "known",
        ...emptyKnownState(peerKnownState.id),
      };
      asDependencyOf && (emptyKnownMessage.asDependencyOf = asDependencyOf);
      messageMap[peerKnownState.id] = { knownMessage: emptyKnownMessage };
      return messageMap;
    }

    const allCoValueSessions = await this.dbClient.getCoValueSessions(
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

    const dependedOnCoValuesList = getDependedOnCoValues({
      coValueRow,
      newContentMessages,
    });

    const knownMessage: KnownStateMessage = {
      action: "known",
      ...newCoValueKnownState,
    };
    asDependencyOf && (knownMessage.asDependencyOf = asDependencyOf);
    messageMap[newCoValueKnownState.id] = {
      knownMessage: knownMessage,
      contentMessages: newContentMessages,
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

  handlePull(msg: CojsonInternalTypes.PullMessage) {
    return this.sendNewContent(msg);
  }

  async handlePush(msg: PushMessage) {
    const coValueRow = await this.dbClient.getCoValue(msg.id);

    // We have no info about coValue header
    const invalidAssumptionOnHeaderPresence = !msg.header && !coValueRow;

    if (invalidAssumptionOnHeaderPresence) {
      return this.sendStateMessage({
        ...emptyKnownState(msg.id),
        action: "pull",
      });
    }

    const { needMissingTransactions, ourKnown } = await this.addTransactions(
      coValueRow,
      msg,
    );

    if (needMissingTransactions) {
      return this.sendStateMessage({
        action: "pull",
        ...ourKnown,
      });
    }

    return this.sendStateMessage({
      action: "ack",
      ...ourKnown,
    });
  }

  async handleData(msg: DataMessage) {
    const coValueRow = await this.dbClient.getCoValue(msg.id);

    // We have no info about coValue header
    const invalidAssumptionOnHeaderPresence = !msg.header && !coValueRow;

    if (invalidAssumptionOnHeaderPresence) {
      console.error(
        'invalidAssumptionOnHeaderPresence. We should never be here. "Data" action is a response to our specific request. TODO Log error. Fix this. Retry request',
      );
      return;
    }

    const { needMissingTransactions } = await this.addTransactions(
      coValueRow,
      msg,
    );

    if (needMissingTransactions) {
      console.error(
        'needMissingTransactions. We should never be here. "Data" action is a response to our specific request. TODO Log error. Fix this. Retry request',
      );
      return;
    }
  }

  private async addTransactions(
    coValueRow: StoredCoValueRow | undefined,
    msg: DataMessage | PushMessage,
  ) {
    const storedCoValueRowID: number = coValueRow
      ? coValueRow.rowID
      : await this.dbClient.addCoValue(msg);

    const allOurSessionsEntries =
      await this.dbClient.getCoValueSessions(storedCoValueRowID);

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

    let needMissingTransactions = false;

    await this.dbClient.unitOfWork(() =>
      (Object.keys(msg.new) as SessionID[]).map((sessionID) => {
        const sessionRow = allOurSessions[sessionID];
        if (sessionRow) {
          ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;
        }

        if ((sessionRow?.lastIdx || 0) < (msg.new[sessionID]?.after || 0)) {
          needMissingTransactions = true;
        } else {
          return this.putNewTxs(msg, sessionID, sessionRow, storedCoValueRowID);
        }
      }),
    );
    return { ourKnown, needMissingTransactions };
  }

  private async putNewTxs(
    msg: DataMessage | PushMessage,
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
      sessionID,
      lastIdx: newLastIdx,
      lastSignature: msg.new[sessionID]!.lastSignature,
      bytesSinceLastSignature: newBytesSinceLastSignature,
    };

    const sessionRowID: number = await this.dbClient.addSessionUpdate({
      sessionUpdate,
      sessionRow,
    });

    if (shouldWriteSignature) {
      await this.dbClient.addSignatureAfter({
        sessionRowID,
        idx: newLastIdx - 1,
        signature: msg.new[sessionID]!.lastSignature,
      });
    }

    return Promise.all(
      actuallyNewTransactions.map((newTransaction, i) =>
        this.dbClient.addTransaction(sessionRowID, nextIdx + i, newTransaction),
      ),
    );
  }

  handleKnown(_msg: CojsonInternalTypes.KnownStateMessage) {
    // We don't intend to use the storage (SQLite,IDB,etc.) itself as a synchronisation mechanism, so we can ignore the known messages
  }

  handleDone(_msg: CojsonInternalTypes.DoneMessage) {}

  async sendStateMessage(msg: any): Promise<unknown> {
    return this.toLocalNode
      .push(msg)
      .catch((e) =>
        console.error(`Error sending ${msg.action} state, id ${msg.id}`, e),
      );
  }
}
