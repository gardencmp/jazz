import { CoMap, CoValue, MapOpPayload } from "./cojsonValue";
import { JsonValue } from "./jsonValue";
import { KeyID, RecipientID, SealedSet, SignatoryID } from "./crypto";
import {
    AgentID,
    MultiLog,
    MultiLogID,
    SessionID,
    Transaction,
    TransactionID,
    TrustingTransaction,
    agentIDfromSessionID,
} from "./multilog";

export type PermissionsDef =
    | { type: "team"; initialAdmin: AgentID; parentTeams?: MultiLogID[] }
    | { type: "ownedByTeam"; team: MultiLogID }
    | {
          type: "agent";
          initialSignatoryID: SignatoryID;
          initialRecipientID: RecipientID;
      }
    | { type: "unsafeAllowAll" };

export type Role = "reader" | "writer" | "admin" | "revoked";

export function determineValidTransactions(
    multilog: MultiLog
): { txID: TransactionID; tx: Transaction }[] {
    if (multilog.header.ruleset.type === "team") {
        const allTrustingTransactionsSorted = Object.entries(
            multilog.sessions
        ).flatMap(([sessionID, sessionLog]) => {
            return sessionLog.transactions
                .map((tx, txIndex) => ({ sessionID, txIndex, tx }))
                .filter(({ tx }) => {
                    if (tx.privacy === "trusting") {
                        return true;
                    } else {
                        console.warn("Unexpected private transaction in Team");
                        return false;
                    }
                }) as {
                sessionID: SessionID;
                txIndex: number;
                tx: TrustingTransaction;
            }[];
        });

        allTrustingTransactionsSorted.sort((a, b) => {
            return a.tx.madeAt - b.tx.madeAt;
        });

        const initialAdmin = multilog.header.ruleset.initialAdmin;

        if (!initialAdmin) {
            throw new Error("Team must have initialAdmin");
        }

        const memberState: { [agent: AgentID]: Role } = {};

        const validTransactions: { txID: TransactionID; tx: Transaction }[] =
            [];

        for (const {
            sessionID,
            txIndex,
            tx,
        } of allTrustingTransactionsSorted) {
            // console.log("before", { memberState, validTransactions });
            const transactor = agentIDfromSessionID(sessionID);

            const change = tx.changes[0] as
                | MapOpPayload<AgentID, Role>
                | MapOpPayload<"readKey", JsonValue>;
            if (tx.changes.length !== 1) {
                console.warn("Team transaction must have exactly one change");
                continue;
            }

            if (change.op !== "insert") {
                console.warn("Team transaction must set a role or readKey");
                continue;
            }

            if (change.key === "readKey") {
                if (memberState[transactor] !== "admin") {
                    console.warn("Only admins can set readKeys");
                    continue;
                }

                // TODO: check validity of agents who the key is revealed to?

                validTransactions.push({ txID: { sessionID, txIndex }, tx });
                continue;
            }

            const affectedMember = change.key;
            const assignedRole = change.value;

            if (
                change.value !== "admin" &&
                change.value !== "writer" &&
                change.value !== "reader"
            ) {
                console.warn("Team transaction must set a valid role");
                continue;
            }

            const isFirstSelfAppointment =
                !memberState[transactor] &&
                transactor === initialAdmin &&
                change.op === "insert" &&
                change.key === transactor &&
                change.value === "admin";

            if (!isFirstSelfAppointment) {
                if (memberState[transactor] !== "admin") {
                    console.warn(
                        "Team transaction must be made by current admin"
                    );
                    continue;
                }

                if (
                    memberState[affectedMember] === "admin" &&
                    affectedMember !== transactor &&
                    assignedRole !== "admin"
                ) {
                    console.warn("Admins can only demote themselves.");
                    continue;
                }
            }

            memberState[affectedMember] = change.value;
            validTransactions.push({ txID: { sessionID, txIndex }, tx });

            // console.log("after", { memberState, validTransactions });
        }

        return validTransactions;
    } else if (multilog.header.ruleset.type === "ownedByTeam") {
        const teamContent =
            multilog.requiredMultiLogs[
                multilog.header.ruleset.team
            ].getCurrentContent();

        if (teamContent.type !== "comap") {
            throw new Error("Team must be a map");
        }

        return Object.entries(multilog.sessions).flatMap(
            ([sessionID, sessionLog]) => {
                const transactor = agentIDfromSessionID(sessionID as SessionID);
                return sessionLog.transactions
                    .filter((tx) => {
                        const transactorRoleAtTxTime = teamContent.getAtTime(
                            transactor,
                            tx.madeAt
                        );

                        return (
                            transactorRoleAtTxTime === "admin" ||
                            transactorRoleAtTxTime === "writer"
                        );
                    })
                    .map((tx, txIndex) => ({
                        txID: { sessionID: sessionID as SessionID, txIndex },
                        tx,
                    }));
            }
        );
    } else if (multilog.header.ruleset.type === "unsafeAllowAll") {
        return Object.entries(multilog.sessions).flatMap(
            ([sessionID, sessionLog]) => {
                return sessionLog.transactions.map((tx, txIndex) => ({
                    txID: { sessionID: sessionID as SessionID, txIndex },
                    tx,
                }));
            }
        );
    } else {
        throw new Error("Unknown ruleset type " + multilog.header.ruleset.type);
    }
}

export type TeamContent = { [key: AgentID]: Role } & {
    readKey: { keyID: KeyID; revelation: SealedSet };
};

export function expectTeam(content: CoValue): CoMap<TeamContent, {}> {
    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    return content as CoMap<TeamContent, {}>;
}
