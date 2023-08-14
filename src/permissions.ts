import { CoID, ContentType } from "./contentType.js";
import { CoMap, MapOpPayload } from "./contentTypes/coMap.js";
import { JsonObject, JsonValue } from "./jsonValue.js";
import {
    Encrypted,
    KeyID,
    KeySecret,
    createdNowUnique,
    newRandomKeySecret,
    seal,
    encryptKeySecret,
    getAgentSealerID,
    Sealed,
} from "./crypto.js";
import {
    CoValue,
    Transaction,
    TrustingTransaction,
    accountOrAgentIDfromSessionID,
} from "./coValue.js";
import { LocalNode } from "./node.js";
import { RawCoID, SessionID, TransactionID, isAgentID } from "./ids.js";
import { AccountIDOrAgentID, GeneralizedControlledAccount } from "./account.js";

export type PermissionsDef =
    | { type: "team"; initialAdmin: AccountIDOrAgentID }
    | { type: "ownedByTeam"; team: RawCoID }
    | { type: "unsafeAllowAll" };

export type Role = "reader" | "writer" | "admin" | "revoked";

export function determineValidTransactions(
    coValue: CoValue
): { txID: TransactionID; tx: Transaction }[] {
    if (coValue.header.ruleset.type === "team") {
        const allTrustingTransactionsSorted = Object.entries(
            coValue.sessions
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

        const initialAdmin = coValue.header.ruleset.initialAdmin;

        if (!initialAdmin) {
            throw new Error("Team must have initialAdmin");
        }

        const memberState: { [agent: AccountIDOrAgentID]: Role } = {};

        const validTransactions: { txID: TransactionID; tx: Transaction }[] =
            [];

        for (const {
            sessionID,
            txIndex,
            tx,
        } of allTrustingTransactionsSorted) {
            // console.log("before", { memberState, validTransactions });
            const transactor = accountOrAgentIDfromSessionID(sessionID);

            const change = tx.changes[0] as
                | MapOpPayload<AccountIDOrAgentID, Role>
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

                validTransactions.push({ txID: { sessionID, txIndex }, tx });
                continue;
            } else if (isKeyForKeyField(change.key) || isKeyForAccountField(change.key)) {
                if (memberState[transactor] !== "admin") {
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
                change.value !== "revoked"
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
    } else if (coValue.header.ruleset.type === "ownedByTeam") {
        const teamContent = coValue.node
            .expectCoValueLoaded(
                coValue.header.ruleset.team,
                "Determining valid transaction in owned object but its team wasn't loaded"
            )
            .getCurrentContent();

        if (teamContent.type !== "comap") {
            throw new Error("Team must be a map");
        }

        return Object.entries(coValue.sessions).flatMap(
            ([sessionID, sessionLog]) => {
                const transactor = accountOrAgentIDfromSessionID(
                    sessionID as SessionID
                );
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

export type TeamContent = {
    [key: AccountIDOrAgentID]: Role;
    readKey: KeyID;
    [revelationFor: `${KeyID}_for_${AccountIDOrAgentID}`]: Sealed<KeySecret>;
    [oldKeyForNewKey: `${KeyID}_for_${KeyID}`]: Encrypted<
        KeySecret,
        { encryptedID: KeyID; encryptingID: KeyID }
    >;
};

export function expectTeamContent(
    content: ContentType
): CoMap<TeamContent, JsonObject | null> {
    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    return content as CoMap<TeamContent, JsonObject | null>;
}

export class Team {
    teamMap: CoMap<TeamContent, JsonObject | null>;
    node: LocalNode;

    constructor(teamMap: CoMap<TeamContent, JsonObject | null>, node: LocalNode) {
        this.teamMap = teamMap;
        this.node = node;
    }

    get id(): CoID<CoMap<TeamContent, JsonObject | null>> {
        return this.teamMap.id;
    }

    addMember(accountID: AccountIDOrAgentID, role: Role) {
        this.teamMap = this.teamMap.edit((map) => {
            const currentReadKey = this.teamMap.coValue.getCurrentReadKey();

            if (!currentReadKey.secret) {
                throw new Error("Can't add member without read key secret");
            }

            const agent = this.node.resolveAccountAgent(
                accountID,
                "Expected to know agent to add them to team"
            );

            map.set(accountID, role, "trusting");

            if (map.get(accountID) !== role) {
                throw new Error("Failed to set role");
            }

            map.set(
                `${currentReadKey.id}_for_${accountID}`,
                seal(
                    currentReadKey.secret,
                    this.teamMap.coValue.node.account.currentSealerSecret(),
                    getAgentSealerID(agent),
                    {
                        in: this.teamMap.coValue.id,
                        tx: this.teamMap.coValue.nextTransactionID(),
                    }
                ),
                "trusting"
            );
        });
    }

    rotateReadKey() {
        const currentlyPermittedReaders = this.teamMap.keys().filter((key) => {
            if (key.startsWith("co_") || isAgentID(key)) {
                const role = this.teamMap.get(key);
                return (
                    role === "admin" || role === "writer" || role === "reader"
                );
            } else {
                return false;
            }
        }) as AccountIDOrAgentID[];

        const maybeCurrentReadKey = this.teamMap.coValue.getCurrentReadKey();

        if (!maybeCurrentReadKey.secret) {
            throw new Error(
                "Can't rotate read key secret we don't have access to"
            );
        }

        const currentReadKey = {
            id: maybeCurrentReadKey.id,
            secret: maybeCurrentReadKey.secret,
        };

        const newReadKey = newRandomKeySecret();

        this.teamMap = this.teamMap.edit((map) => {
            for (const readerID of currentlyPermittedReaders) {
                const reader = this.node.resolveAccountAgent(
                    readerID,
                    "Expected to know currently permitted reader"
                );

                map.set(
                    `${newReadKey.id}_for_${readerID}`,
                    seal(
                        newReadKey.secret,
                        this.teamMap.coValue.node.account.currentSealerSecret(),
                        getAgentSealerID(reader),
                        {
                            in: this.teamMap.coValue.id,
                            tx: this.teamMap.coValue.nextTransactionID(),
                        }
                    ),
                    "trusting"
                );
            }

            map.set(
                `${currentReadKey.id}_for_${newReadKey.id}`,
                encryptKeySecret({
                    encrypting: newReadKey,
                    toEncrypt: currentReadKey,
                }).encrypted,
                "trusting"
            );

            map.set("readKey", newReadKey.id, "trusting");
        });
    }

    removeMember(accountID: AccountIDOrAgentID) {
        this.teamMap = this.teamMap.edit((map) => {
            map.set(accountID, "revoked", "trusting");
        });

        this.rotateReadKey();
    }

    createMap<M extends { [key: string]: JsonValue }, Meta extends JsonObject | null>(
        meta?: M
    ): CoMap<M, Meta> {
        return this.node
            .createCoValue({
                type: "comap",
                ruleset: {
                    type: "ownedByTeam",
                    team: this.teamMap.id,
                },
                meta: meta || null,
                ...createdNowUnique(),
            })
            .getCurrentContent() as CoMap<M, Meta>;
    }

    testWithDifferentAccount(
        account: GeneralizedControlledAccount,
        sessionId: SessionID
    ): Team {
        return new Team(
            expectTeamContent(
                this.teamMap.coValue
                    .testWithDifferentAccount(account, sessionId)
                    .getCurrentContent()
            ),
            this.node
        );
    }
}

export function isKeyForKeyField(field: string): field is `${KeyID}_for_${KeyID}` {
    return field.startsWith("key_") && field.includes("_for_key");
}

export function isKeyForAccountField(field: string): field is `${KeyID}_for_${AccountIDOrAgentID}` {
    return field.startsWith("key_") && (field.includes("_for_sealer") || field.includes("_for_co"));
}