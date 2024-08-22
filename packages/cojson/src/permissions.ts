import { CoID } from "./coValue.js";
import { MapOpPayload } from "./coValues/coMap.js";
import { JsonValue } from "./jsonValue.js";
import { KeyID } from "./crypto/crypto.js";
import { CoValueCore, Transaction } from "./coValueCore.js";
import { accountOrAgentIDfromSessionID } from "./typeUtils/accountOrAgentIDfromSessionID.js";
import { AgentID, RawCoID, SessionID, TransactionID } from "./ids.js";
import { RawAccount, AccountID, RawProfile } from "./coValues/account.js";
import { parseJSON } from "./jsonStringify.js";
import { EVERYONE, Everyone } from "./coValues/group.js";
import { expectGroup } from "./typeUtils/expectGroup.js";

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
    coValue: CoValueCore,
): { txID: TransactionID; tx: Transaction }[] {
    if (coValue.header.ruleset.type === "group") {
        const allTransactionsSorted = [
            ...coValue.sessionLogs.entries(),
        ].flatMap(([sessionID, sessionLog]) => {
            return sessionLog.transactions.map((tx, txIndex) => ({
                sessionID,
                txIndex,
                tx,
            })) as {
                sessionID: SessionID;
                txIndex: number;
                tx: Transaction;
            }[];
        });

        allTransactionsSorted.sort((a, b) => {
            return a.tx.madeAt - b.tx.madeAt;
        });

        const initialAdmin = coValue.header.ruleset.initialAdmin;

        if (!initialAdmin) {
            throw new Error("Group must have initialAdmin");
        }

        const memberState: {
            [agent: AccountID | AgentID]: Role;
            [EVERYONE]?: Role;
        } = {};

        const validTransactions: { txID: TransactionID; tx: Transaction }[] =
            [];

        for (const { sessionID, txIndex, tx } of allTransactionsSorted) {
            // console.log("before", { memberState, validTransactions });
            const transactor = accountOrAgentIDfromSessionID(sessionID);

            if (tx.privacy === "private") {
                if (memberState[transactor] === "admin") {
                    validTransactions.push({
                        txID: { sessionID, txIndex },
                        tx,
                    });
                    continue;
                } else {
                    console.warn(
                        "Only admins can make private transactions in groups",
                    );
                    continue;
                }
            }

            let changes;

            try {
                changes = parseJSON(tx.changes);
            } catch (e) {
                console.warn(
                    coValue.id,
                    "Invalid JSON in transaction",
                    e,
                    tx,
                    JSON.stringify(tx.changes, (k, v) =>
                        k === "changes" || k === "encryptedChanges"
                            ? v.slice(0, 20) + "..."
                            : v,
                    ),
                );
                continue;
            }

            const change = changes[0] as
                | MapOpPayload<AccountID | AgentID | Everyone, Role>
                | MapOpPayload<"readKey", JsonValue>
                | MapOpPayload<"profile", CoID<RawProfile>>;
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

            if (
                affectedMember === EVERYONE &&
                !(
                    change.value === "reader" ||
                    change.value === "writer" ||
                    change.value === "revoked"
                )
            ) {
                console.warn(
                    "Everyone can only be set to reader, writer or revoked",
                );
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
                        "Group transaction must be made by current admin or invite",
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
        const groupContent = expectGroup(
            coValue.node
                .expectCoValueLoaded(
                    coValue.header.ruleset.group,
                    "Determining valid transaction in owned object but its group wasn't loaded",
                )
                .getCurrentContent(),
        );

        if (groupContent.type !== "comap") {
            throw new Error("Group must be a map");
        }

        return [...coValue.sessionLogs.entries()].flatMap(
            ([sessionID, sessionLog]) => {
                const transactor = accountOrAgentIDfromSessionID(sessionID);

                return sessionLog.transactions
                    .filter((tx) => {
                        const groupAtTime = groupContent.atTime(tx.madeAt);
                        const effectiveTransactor =
                            transactor === groupContent.id &&
                            groupAtTime instanceof RawAccount
                                ? groupAtTime.currentAgentID().match(
                                      (agentID) => agentID,
                                      (e) => {
                                          console.error(
                                              "Error while determining current agent ID in valid transactions",
                                              e,
                                          );
                                          return undefined;
                                      },
                                  )
                                : transactor;

                        if (!effectiveTransactor) {
                            return false;
                        }

                        const transactorRoleAtTxTime =
                            groupAtTime.get(effectiveTransactor) ||
                            groupAtTime.get(EVERYONE);

                        return (
                            transactorRoleAtTxTime === "admin" ||
                            transactorRoleAtTxTime === "writer"
                        );
                    })
                    .map((tx, txIndex) => ({
                        txID: { sessionID: sessionID, txIndex },
                        tx,
                    }));
            },
        );
    } else if (coValue.header.ruleset.type === "unsafeAllowAll") {
        return [...coValue.sessionLogs.entries()].flatMap(
            ([sessionID, sessionLog]) => {
                return sessionLog.transactions.map((tx, txIndex) => ({
                    txID: { sessionID: sessionID, txIndex },
                    tx,
                }));
            },
        );
    } else {
        throw new Error(
            "Unknown ruleset type " +
                (coValue.header.ruleset as { type: string }).type,
        );
    }
}

export function isKeyForKeyField(co: string): co is `${KeyID}_for_${KeyID}` {
    return co.startsWith("key_") && co.includes("_for_key");
}

export function isKeyForAccountField(
    co: string,
): co is `${KeyID}_for_${AccountID | AgentID}` {
    return (
        (co.startsWith("key_") &&
            (co.includes("_for_sealer") || co.includes("_for_co"))) ||
        co.includes("_for_everyone")
    );
}
