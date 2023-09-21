import { CoID } from "./coValue.js";
import { MapOpPayload } from "./coValues/coMap.js";
import { JsonValue } from "./jsonValue.js";
import { KeyID } from "./crypto.js";
import {
    CoValueCore,
    Transaction,
    TrustingTransaction,
    accountOrAgentIDfromSessionID,
} from "./coValueCore.js";
import { AgentID, RawCoID, SessionID, TransactionID } from "./ids.js";
import { AccountID, Profile } from "./account.js";
import { parseJSON } from "./jsonStringify.js";
import { expectGroupContent } from "./group.js";

export type PermissionsDef =
    | { type: "group"; initialAdmin: AccountID | AgentID }
    | { type: "ownedByGroup"; group: RawCoID }
    | { type: "unsafeAllowAll" };

export type Role =
    | "reader"
    | "writer"
    | "admin"
    | "revoked"
    | "adminInvite"
    | "writerInvite"
    | "readerInvite";

export function determineValidTransactions(
    coValue: CoValueCore
): { txID: TransactionID; tx: Transaction }[] {
    if (coValue.header.ruleset.type === "group") {
        const allTrustingTransactionsSorted = Object.entries(
            coValue.sessions
        ).flatMap(([sessionID, sessionLog]) => {
            return sessionLog.transactions
                .map((tx, txIndex) => ({ sessionID, txIndex, tx }))
                .filter(({ tx }) => {
                    if (tx.privacy === "trusting") {
                        return true;
                    } else {
                        console.warn("Unexpected private transaction in Group");
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

        const initialAdmin = coValue.header.ruleset.initialAdmin;

        if (!initialAdmin) {
            throw new Error("Group must have initialAdmin");
        }

        const memberState: { [agent: AccountID | AgentID]: Role } = {};

        const validTransactions: { txID: TransactionID; tx: Transaction }[] =
            [];

        for (const {
            sessionID,
            txIndex,
            tx,
        } of allTrustingTransactionsSorted) {
            // console.log("before", { memberState, validTransactions });
            const transactor = accountOrAgentIDfromSessionID(sessionID);

            const changes = parseJSON(tx.changes);

            const change = changes[0] as
                | MapOpPayload<AccountID | AgentID, Role>
                | MapOpPayload<"readKey", JsonValue>
                | MapOpPayload<"profile", CoID<Profile>>;
            if (changes.length !== 1) {
                console.warn("Group transaction must have exactly one change");
                continue;
            }

            if (change.op !== "set") {
                console.warn("Group transaction must set a role or readKey");
                continue;
            }

            if (change.key === "readKey") {
                if (memberState[transactor] !== "admin") {
                    console.warn("Only admins can set readKeys");
                    continue;
                }

                validTransactions.push({ txID: { sessionID, txIndex }, tx });
                continue;
            } else if (change.key === "profile") {
                if (memberState[transactor] !== "admin") {
                    console.warn("Only admins can set profile");
                    continue;
                }

                validTransactions.push({ txID: { sessionID, txIndex }, tx });
                continue;
            } else if (
                isKeyForKeyField(change.key) ||
                isKeyForAccountField(change.key)
            ) {
                if (
                    memberState[transactor] !== "admin" &&
                    memberState[transactor] !== "adminInvite" &&
                    memberState[transactor] !== "writerInvite" &&
                    memberState[transactor] !== "readerInvite"
                ) {
                    console.warn("Only admins can reveal keys");
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
                change.value !== "reader" &&
                change.value !== "revoked" &&
                change.value !== "adminInvite" &&
                change.value !== "writerInvite" &&
                change.value !== "readerInvite"
            ) {
                console.warn("Group transaction must set a valid role");
                continue;
            }

            const isFirstSelfAppointment =
                !memberState[transactor] &&
                transactor === initialAdmin &&
                change.op === "set" &&
                change.key === transactor &&
                change.value === "admin";

            if (!isFirstSelfAppointment) {
                if (memberState[transactor] === "admin") {
                    if (
                        memberState[affectedMember] === "admin" &&
                        affectedMember !== transactor &&
                        assignedRole !== "admin"
                    ) {
                        console.warn("Admins can only demote themselves.");
                        continue;
                    }
                } else if (memberState[transactor] === "adminInvite") {
                    if (change.value !== "admin") {
                        console.warn("AdminInvites can only create admins.");
                        continue;
                    }
                } else if (memberState[transactor] === "writerInvite") {
                    if (change.value !== "writer") {
                        console.warn("WriterInvites can only create writers.");
                        continue;
                    }
                } else if (memberState[transactor] === "readerInvite") {
                    if (change.value !== "reader") {
                        console.warn("ReaderInvites can only create reader.");
                        continue;
                    }
                } else {
                    console.warn(
                        "Group transaction must be made by current admin or invite"
                    );
                    continue;
                }
            }

            memberState[affectedMember] = change.value;
            validTransactions.push({ txID: { sessionID, txIndex }, tx });

            // console.log("after", { memberState, validTransactions });
        }

        return validTransactions;
    } else if (coValue.header.ruleset.type === "ownedByGroup") {
        const groupContent = expectGroupContent(
            coValue.node
                .expectCoValueLoaded(
                    coValue.header.ruleset.group,
                    "Determining valid transaction in owned object but its group wasn't loaded"
                )
                .getCurrentContent()
        );

        if (groupContent.type !== "comap") {
            throw new Error("Group must be a map");
        }

        return Object.entries(coValue.sessions).flatMap(
            ([sessionID, sessionLog]) => {
                const transactor = accountOrAgentIDfromSessionID(
                    sessionID as SessionID
                );
                return sessionLog.transactions
                    .filter((tx) => {
                        const transactorRoleAtTxTime = groupContent
                            .atTime(tx.madeAt)
                            .get(transactor);

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
    } else if (coValue.header.ruleset.type === "unsafeAllowAll") {
        return Object.entries(coValue.sessions).flatMap(
            ([sessionID, sessionLog]) => {
                return sessionLog.transactions.map((tx, txIndex) => ({
                    txID: { sessionID: sessionID as SessionID, txIndex },
                    tx,
                }));
            }
        );
    } else {
        throw new Error(
            "Unknown ruleset type " + (coValue.header.ruleset as any).type
        );
    }
}

export function isKeyForKeyField(
    field: string
): field is `${KeyID}_for_${KeyID}` {
    return field.startsWith("key_") && field.includes("_for_key");
}

export function isKeyForAccountField(
    field: string
): field is `${KeyID}_for_${AccountID | AgentID}` {
    return (
        field.startsWith("key_") &&
        (field.includes("_for_sealer") || field.includes("_for_co"))
    );
}
