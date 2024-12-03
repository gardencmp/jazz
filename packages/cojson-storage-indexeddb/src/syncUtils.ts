import {
  CojsonInternalTypes,
  RawAccountID,
  SessionID,
  cojsonInternals,
} from "cojson";
import {
  SignatureAfterRow,
  StoredCoValueRow,
  StoredSessionRow,
  TransactionRow,
} from "./idbClient";

export function collectNewTxs(
  newTxsInSession: TransactionRow[],
  newContentMessages: CojsonInternalTypes.NewContentMessage[],
  sessionRow: StoredSessionRow,
  signaturesAndIdxs: SignatureAfterRow[],
  theirKnown: CojsonInternalTypes.CoValueKnownState,
  firstNewTxIdx: number,
) {
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
        id: theirKnown.id,
        new: {},
        priority: cojsonInternals.getPriorityFromHeader(undefined),
      });
    } else if (idx === firstNewTxIdx + newTxsInSession.length - 1) {
      sessionEntry.lastSignature = sessionRow.lastSignature;
    }
    idx += 1;
  }
}

export function getDependedOnCoValues({
  coValueRow,
  newContentMessages,
}: {
  coValueRow: StoredCoValueRow;
  newContentMessages: CojsonInternalTypes.NewContentMessage[];
}) {
  return coValueRow.header.ruleset.type === "group"
    ? newContentMessages
        .flatMap((piece) => Object.values(piece.new))
        .flatMap((sessionEntry) =>
          sessionEntry.newTransactions.flatMap((tx) => {
            if (tx.privacy !== "trusting") return [];
            return cojsonInternals
              .parseJSON(tx.changes)
              .map(
                (change) =>
                  change &&
                  typeof change === "object" &&
                  "op" in change &&
                  change.op === "set" &&
                  "key" in change &&
                  change.key,
              )
              .flatMap((key) =>
                typeof key === "string"
                  ? key.startsWith("co_")
                    ? [key as CojsonInternalTypes.RawCoID]
                    : key.startsWith("parent_co_")
                      ? [
                          key.replace(
                            "parent_",
                            "",
                          ) as CojsonInternalTypes.RawCoID,
                        ]
                      : []
                  : [],
              );
          }),
        )
    : coValueRow.header.ruleset.type === "ownedByGroup"
      ? [
          coValueRow.header.ruleset.group,
          ...new Set(
            newContentMessages.flatMap((piece) =>
              Object.keys(piece.new)
                .map((sessionID) =>
                  cojsonInternals.accountOrAgentIDfromSessionID(
                    sessionID as SessionID,
                  ),
                )
                .filter(
                  (accountID): accountID is RawAccountID =>
                    cojsonInternals.isAccountID(accountID) &&
                    accountID !== coValueRow.id,
                ),
            ),
          ),
        ]
      : [];
}
