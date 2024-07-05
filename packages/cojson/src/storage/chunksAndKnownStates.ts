import { Either } from "effect";
import { RawCoID, SessionID } from "../ids.js";
import { MAX_RECOMMENDED_TX_SIZE } from "../index.js";
import { CoValueKnownState, NewContentMessage } from "../sync.js";
import { CoValueChunk } from "./index.js";

export function contentSinceChunk(
    id: RawCoID,
    chunk: CoValueChunk,
    known?: CoValueKnownState,
): NewContentMessage[] {
    const newContentPieces: NewContentMessage[] = [];

    newContentPieces.push({
        id: id,
        action: "content",
        header: known?.header ? undefined : chunk.header,
        new: {},
    });

    for (const [sessionID, sessionsEntry] of Object.entries(
        chunk.sessionEntries,
    )) {
        for (const entry of sessionsEntry) {
            const knownStart = known?.sessions[sessionID as SessionID] || 0;

            if (entry.after + entry.transactions.length <= knownStart) {
                continue;
            }

            const actuallyNewTransactions = entry.transactions.slice(
                Math.max(0, knownStart - entry.after),
            );

            const newAfter =
                entry.after +
                (actuallyNewTransactions.length - entry.transactions.length);

            let newContentEntry =
                newContentPieces[0]?.new[sessionID as SessionID];

            if (!newContentEntry) {
                newContentEntry = {
                    after: newAfter,
                    lastSignature: entry.lastSignature,
                    newTransactions: actuallyNewTransactions,
                };
                newContentPieces[0]!.new[sessionID as SessionID] =
                    newContentEntry;
            } else {
                newContentEntry.newTransactions.push(
                    ...actuallyNewTransactions,
                );
                newContentEntry.lastSignature = entry.lastSignature;
            }
        }
    }

    return newContentPieces;
}

export function chunkToKnownState(id: RawCoID, chunk: CoValueChunk) {
    const ourKnown: CoValueKnownState = {
        id,
        header: !!chunk.header,
        sessions: {},
    };

    for (const [sessionID, sessionEntries] of Object.entries(
        chunk.sessionEntries,
    )) {
        for (const entry of sessionEntries) {
            ourKnown.sessions[sessionID as SessionID] =
                entry.after + entry.transactions.length;
        }
    }
    return ourKnown;
}

export function mergeChunks(
    chunkA: CoValueChunk,
    chunkB: CoValueChunk,
): Either.Either<"nonContigous", CoValueChunk> {
    const header = chunkA.header || chunkB.header;

    const newSessions = { ...chunkA.sessionEntries };
    for (const sessionID in chunkB.sessionEntries) {
        // figure out if we can merge the chunks
        const sessionEntriesA = chunkA.sessionEntries[sessionID];
        const sessionEntriesB = chunkB.sessionEntries[sessionID]!;

        if (!sessionEntriesA) {
            newSessions[sessionID] = sessionEntriesB;
            continue;
        }

        const lastEntryOfA = sessionEntriesA[sessionEntriesA.length - 1]!;
        const firstEntryOfB = sessionEntriesB[0]!;

        if (
            lastEntryOfA.after + lastEntryOfA.transactions.length ===
            firstEntryOfB.after
        ) {
            const newEntries = [];
            let bytesSinceLastSignature = 0;
            for (const entry of sessionEntriesA.concat(sessionEntriesB)) {
                const entryByteLength = entry.transactions.reduce(
                    (sum, tx) =>
                        sum +
                        (tx.privacy === "private"
                            ? tx.encryptedChanges.length
                            : tx.changes.length),
                    0,
                );
                if (
                    newEntries.length === 0 ||
                    bytesSinceLastSignature + entryByteLength >
                        MAX_RECOMMENDED_TX_SIZE
                ) {
                    newEntries.push({
                        after: entry.after,
                        lastSignature: entry.lastSignature,
                        transactions: entry.transactions,
                    });
                    bytesSinceLastSignature = 0;
                } else {
                    const lastNewEntry = newEntries[newEntries.length - 1]!;
                    lastNewEntry.transactions.push(...entry.transactions);
                    lastNewEntry.lastSignature = entry.lastSignature;

                    bytesSinceLastSignature += entry.transactions.length;
                }
            }
            newSessions[sessionID] = newEntries;
        } else {
            return Either.right("nonContigous" as const);
        }
    }

    return Either.left({ header, sessionEntries: newSessions });
}
