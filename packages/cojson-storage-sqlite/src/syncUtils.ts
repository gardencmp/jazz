import {
  CojsonInternalTypes,
  RawAccountID,
  SessionID,
  cojsonInternals,
} from "cojson";

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
