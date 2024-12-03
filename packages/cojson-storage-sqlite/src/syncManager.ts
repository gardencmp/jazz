import {
  CojsonInternalTypes,
  MAX_RECOMMENDED_TX_SIZE,
  OutgoingSyncQueue,
  SessionID,
  SyncMessage,
  cojsonInternals,
} from "cojson";

import { SQLiteClient, StoredSessionRow } from "./sqlClient";
import { collectNewTxs, getDependedOnCoValues } from "./syncUtils";

export class SyncManager {
  private readonly toLocalNode: OutgoingSyncQueue;
  private readonly dbClient: SQLiteClient;

  constructor(dbClient: SQLiteClient, toLocalNode: OutgoingSyncQueue) {
    this.toLocalNode = toLocalNode;
    this.dbClient = dbClient;
  }

  async handleSyncMessage(msg: SyncMessage) {
    console.log(`Got sync message:`, msg);
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

  async sendNewContent(
    theirKnown: CojsonInternalTypes.CoValueKnownState,
    asDependencyOf?: CojsonInternalTypes.RawCoID,
  ) {
    const coValueRow = await this.dbClient.getCoValue(theirKnown.id);

    const allOurSessions = await (coValueRow
      ? this.dbClient.getCoValueSessions(coValueRow.rowID)
      : []);

    const ourKnown: CojsonInternalTypes.CoValueKnownState = {
      id: theirKnown.id,
      header: !!coValueRow,
      sessions: {},
    };

    let parsedHeader;

    try {
      parsedHeader = (coValueRow?.header && JSON.parse(coValueRow.header)) as
        | CojsonInternalTypes.CoValueHeader
        | undefined;
    } catch (e) {
      console.warn(
        theirKnown.id,
        "Invalid JSON in header",
        e,
        coValueRow?.header,
      );
      return;
    }

    const priority = cojsonInternals.getPriorityFromHeader(parsedHeader);
    const newContentPieces: CojsonInternalTypes.NewContentMessage[] = [
      {
        action: "content",
        id: theirKnown.id,
        header: theirKnown.header ? undefined : parsedHeader,
        new: {},
        priority,
      },
    ];

    for (const sessionRow of allOurSessions) {
      ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;

      if (
        sessionRow.lastIdx > (theirKnown.sessions[sessionRow.sessionID] || 0)
      ) {
        const firstNewTxIdx = theirKnown.sessions[sessionRow.sessionID] || 0;

        const newTxsInSession = await this.dbClient.getNewTransactionInSession(
          sessionRow.rowID,
          firstNewTxIdx,
        );

        const signaturesAndIdxs = await this.dbClient.getSignatures(
          sessionRow.rowID,
          firstNewTxIdx,
        );

        collectNewTxs({
          firstNewTxIdx,
          newTxsInSession,
          newContentPieces,
          sessionRow,
          theirKnown,
          signaturesAndIdxs,
        });
      }
    }

    // TODO parameters
    const dependedOnCoValues = getDependedOnCoValues(
      parsedHeader,
      newContentPieces,
      theirKnown,
    );

    for (const dependedOnCoValue of dependedOnCoValues) {
      await this.sendNewContent(
        { id: dependedOnCoValue, header: false, sessions: {} },
        asDependencyOf || theirKnown.id,
      );
    }

    this.toLocalNode
      .push({
        action: "known",
        ...ourKnown,
        asDependencyOf,
      })
      .catch((e) => console.error("Error while pushing known", e));

    const nonEmptyNewContentPieces = newContentPieces.filter(
      (piece) => piece.header || Object.keys(piece.new).length > 0,
    );

    // console.log(theirKnown.id, nonEmptyNewContentPieces);

    for (const piece of nonEmptyNewContentPieces) {
      this.toLocalNode
        .push(piece)
        .catch((e) => console.error("Error while pushing content piece", e));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  handleLoad(msg: CojsonInternalTypes.LoadMessage) {
    return this.sendNewContent(msg);
  }

  async handleContent(msg: CojsonInternalTypes.NewContentMessage) {
    const coValueRow = await this.dbClient.getCoValue(msg.id);

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

    let invalidAssumptions = false;

    await this.dbClient.db.transaction(async () => {
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
      });
    })();

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

    const sessionRowID = await this.dbClient.addSessionUpdate(sessionUpdate);

    if (shouldWriteSignature) {
      await this.dbClient.addSignatureAfter({
        sessionRowID,
        idx: newLastIdx - 1,
        signature: msg.new[sessionID]!.lastSignature,
      });
    }

    return actuallyNewTransactions.map((newTransaction, i) =>
      this.dbClient.addTransaction(sessionRowID, nextIdx + i, newTransaction),
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
