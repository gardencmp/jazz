import { CoMap, ContentType, MapOpPayload } from "./contentType";
import { JsonValue } from "./jsonValue";
import {
    Encrypted,
    KeyID,
    KeySecret,
    RecipientID,
    SealedSet,
    SignatoryID,
    encryptForTransaction,
    newRandomKeySecret,
    seal,
    sealKeySecret,
} from "./crypto";
import {
    AgentCredential,
    AgentID,
    CoValue,
    RawCoValueID,
    SessionID,
    Transaction,
    TransactionID,
    TrustingTransaction,
    agentIDfromSessionID,
} from "./coValue";
import { LocalNode } from ".";

export type PermissionsDef =
    | { type: "team"; initialAdmin: AgentID; parentTeams?: RawCoValueID[] }
    | { type: "ownedByTeam"; team: RawCoValueID }
    | {
          type: "agent";
          initialSignatoryID: SignatoryID;
          initialRecipientID: RecipientID;
      }
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
        const teamContent =
            coValue.node.expectCoValueLoaded(
                coValue.header.ruleset.team,
                "Determining valid transaction in owned object but its team wasn't loaded"
            ).getCurrentContent();

        if (teamContent.type !== "comap") {
            throw new Error("Team must be a map");
        }

        return Object.entries(coValue.sessions).flatMap(
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
    } else if (coValue.header.ruleset.type === "unsafeAllowAll") {
        return Object.entries(coValue.sessions).flatMap(
            ([sessionID, sessionLog]) => {
                return sessionLog.transactions.map((tx, txIndex) => ({
                    txID: { sessionID: sessionID as SessionID, txIndex },
                    tx,
                }));
            }
        );
    } else if (coValue.header.ruleset.type === "agent") {
        // TODO
        return [];
    } else {
        throw new Error("Unknown ruleset type " + (coValue.header.ruleset as any).type);
    }
}

export type TeamContent = { [key: AgentID]: Role } & {
    readKey: {
        keyID: KeyID;
        revelation: SealedSet<KeySecret>;
        previousKeys?: {
            [key: KeyID]: Encrypted<
                KeySecret,
                { sealed: KeyID; sealing: KeyID }
            >;
        };
    };
};

export function expectTeamContent(content: ContentType): CoMap<TeamContent, {}> {
    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    return content as CoMap<TeamContent, {}>;
}

export class Team {
    teamMap: CoMap<TeamContent, {}>;
    node: LocalNode;

    constructor(teamMap: CoMap<TeamContent, {}>, node: LocalNode) {
        this.teamMap = teamMap;
        this.node = node;
    }

    get id(): RawCoValueID {
        return this.teamMap.id;
    }

    addMember(agentID: AgentID, role: Role) {
        this.teamMap = this.teamMap.edit((map) => {
            const agent = this.node.expectAgentLoaded(agentID, "Expected to know agent to add them to team");

            if (!agent) {
                throw new Error("Unknown agent " + agentID);
            }

            map.set(agentID, role, "trusting");
            if (map.get(agentID) !== role) {
                throw new Error("Failed to set role");
            }

            const currentReadKey = this.teamMap.coValue.getCurrentReadKey();

            if (!currentReadKey.secret) {
                throw new Error("Can't add member without read key secret");
            }

            const revelation = seal(
                currentReadKey.secret,
                this.teamMap.coValue.node.agentCredential.recipientSecret,
                new Set([agent.recipientID]),
                {
                    in: this.teamMap.coValue.id,
                    tx: this.teamMap.coValue.nextTransactionID(),
                }
            );

            map.set(
                "readKey",
                { keyID: currentReadKey.id, revelation },
                "trusting"
            );
        });
    }

    rotateReadKey() {
        const currentlyPermittedReaders = this.teamMap.keys().filter((key) => {
            if (key.startsWith("co_agent")) {
                const role = this.teamMap.get(key);
                return (
                    role === "admin" || role === "writer" || role === "reader"
                );
            } else {
                return false;
            }
        }) as AgentID[];

        const maybeCurrentReadKey = this.teamMap.coValue.getCurrentReadKey();

        if (!maybeCurrentReadKey.secret) {
            throw new Error("Can't rotate read key secret we don't have access to");
        }

        const currentReadKey = {
            id: maybeCurrentReadKey.id,
            secret: maybeCurrentReadKey.secret,
        };

        const newReadKey = newRandomKeySecret();

        const newReadKeyRevelation = seal(
            newReadKey.secret,
            this.teamMap.coValue.node.agentCredential.recipientSecret,
            new Set(
                currentlyPermittedReaders.map(
                    (reader) => {
                        const readerAgent = this.node.expectAgentLoaded(reader, "Expected to know currently permitted reader");
                        if (!readerAgent) {
                            throw new Error("Unknown agent " + reader);
                        }
                        return readerAgent.recipientID
                    }
                )
            ),
            {
                in: this.teamMap.coValue.id,
                tx: this.teamMap.coValue.nextTransactionID(),
            }
        );

        this.teamMap = this.teamMap.edit((map) => {
            map.set(
                "readKey",
                {
                    keyID: newReadKey.id,
                    revelation: newReadKeyRevelation,
                    previousKeys: {
                        [currentReadKey.id]: sealKeySecret({
                            sealing: newReadKey,
                            toSeal: currentReadKey,
                        }).encrypted,
                    },
                },
                "trusting"
            );
        });
    }

    removeMember(agentID: AgentID) {
        this.teamMap = this.teamMap.edit((map) => {
            map.set(agentID, "revoked", "trusting");
        });

        this.rotateReadKey();
    }

    createMap<M extends { [key: string]: JsonValue }, Meta extends JsonValue>(
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
                publicNickname: "map",
            })
            .getCurrentContent() as CoMap<M, Meta>;
    }

    testWithDifferentCredentials(
        credential: AgentCredential,
        sessionId: SessionID
    ): Team {
        return new Team(
            expectTeamContent(
                this.teamMap.coValue
                    .testWithDifferentCredentials(credential, sessionId)
                    .getCurrentContent()
            ),
            this.node
        );
    }
}
