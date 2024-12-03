import {
  CojsonInternalTypes,
  RawAccountID,
  SessionID,
  cojsonInternals,
} from "cojson";
import {
  SignatureAfterRow,
  StoredSessionRow,
  TransactionRow,
} from "./sqlClient";

export function collectNewTxs({
  newTxsInSession,
  newContentMessages,
  sessionRow,
  signaturesAndIdxs,
  peerKnownState,
  firstNewTxIdx,
}: {
  newTxsInSession: TransactionRow[];
  newContentMessages: CojsonInternalTypes.NewContentMessage[];
  sessionRow: StoredSessionRow;
  signaturesAndIdxs: SignatureAfterRow[];
  peerKnownState: CojsonInternalTypes.CoValueKnownState;
  firstNewTxIdx: number;
}) {
  let idx = firstNewTxIdx;

  for (const tx of newTxsInSession) {
    let sessionEntry =
      newContentMessages[newContentMessages.length - 1]!.new[
        sessionRow.sessionID
      ];
    if (!sessionEntry) {
      sessionEntry = {
        after: idx,
        lastSignature: "WILL_BE_REPLACED" as CojsonInternalTypes.Signature,
        newTransactions: [],
      };
      newContentMessages[newContentMessages.length - 1]!.new[
        sessionRow.sessionID
      ] = sessionEntry;
    }

    sessionEntry.newTransactions.push(tx.tx);

    if (signaturesAndIdxs[0] && idx === signaturesAndIdxs[0].idx) {
      sessionEntry.lastSignature = signaturesAndIdxs[0].signature;
      signaturesAndIdxs.shift();
      newContentMessages.push({
        action: "content",
        id: peerKnownState.id,
        new: {},
        priority: cojsonInternals.getPriorityFromHeader(undefined),
      });
    } else if (idx === firstNewTxIdx + newTxsInSession.length - 1) {
      sessionEntry.lastSignature = sessionRow.lastSignature;
    }
    idx += 1;
  }
}

export function getDependedOnCoValues(
  parsedHeader,
  newContentPieces: CojsonInternalTypes.NewContentMessage[],
  theirKnown: CojsonInternalTypes.CoValueKnownState,
) {
  return parsedHeader?.ruleset.type === "group"
    ? newContentPieces
        .flatMap((piece) => Object.values(piece.new))
        .flatMap((sessionEntry) =>
          sessionEntry.newTransactions.flatMap((tx) => {
            if (tx.privacy !== "trusting") return [];
            // TODO: avoid parsing here?
            let parsedChanges;

            try {
              parsedChanges = cojsonInternals.parseJSON(tx.changes);
            } catch (e) {
              console.warn(
                theirKnown.id,
                "Invalid JSON in transaction",
                e,
                tx.changes,
              );
              return [];
            }

            return parsedChanges
              .map(
                (change) =>
                  change &&
                  typeof change === "object" &&
                  "op" in change &&
                  change.op === "set" &&
                  "key" in change &&
                  change.key,
              )
              .filter(
                (key): key is CojsonInternalTypes.RawCoID =>
                  typeof key === "string" && key.startsWith("co_"),
              );
          }),
        )
    : parsedHeader?.ruleset.type === "ownedByGroup"
      ? [
          parsedHeader?.ruleset.group,
          ...new Set(
            newContentPieces.flatMap((piece) =>
              Object.keys(piece.new)
                .map((sessionID) =>
                  cojsonInternals.accountOrAgentIDfromSessionID(
                    sessionID as SessionID,
                  ),
                )
                .filter(
                  (accountID): accountID is RawAccountID =>
                    cojsonInternals.isAccountID(accountID) &&
                    accountID !== theirKnown.id,
                ),
            ),
          ),
        ]
      : [];
}
