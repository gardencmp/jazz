import { randomBytes } from "@noble/hashes/utils";
import { CoList, CoMap, ContentType, Static, CoStream } from "./contentType";
import {
    Encrypted,
    Hash,
    KeySecret,
    RecipientID,
    RecipientSecret,
    SignatoryID,
    SignatorySecret,
    Signature,
    StreamingHash,
    getRecipientID,
    getSignatoryID,
    newRandomRecipient,
    newRandomSignatory,
    openAs,
    shortHash,
    sign,
    verify,
    encryptForTransaction,
    decryptForTransaction,
    KeyID,
    unsealKeySecret,
} from "./crypto";
import { JsonValue } from "./jsonValue";
import { base58 } from "@scure/base";
import {
    PermissionsDef as RulesetDef,
    determineValidTransactions,
    expectTeamContent,
} from "./permissions";
import { LocalNode } from "./node";
import { CoValueKnownState, NewContentMessage } from "./sync";

export type RawCoValueID = `coval_${string}`;

export type CoValueHeader = {
    type: ContentType["type"];
    ruleset: RulesetDef;
    meta: JsonValue;
};

function coValueIDforHeader(header: CoValueHeader): RawCoValueID {
    const hash = shortHash(header);
    return `coval_${hash.slice("shortHash_".length)}`;
}

export type SessionID = `session_${string}_${AgentID}`;

export function agentIDfromSessionID(sessionID: SessionID): AgentID {
    return `agent_${sessionID.substring(sessionID.lastIndexOf("_") + 1)}`;
}

export function newRandomSessionID(agentID: AgentID): SessionID {
    return `session_${base58.encode(randomBytes(8))}_${agentID}`;
}

type SessionLog = {
    transactions: Transaction[];
    lastHash?: Hash;
    streamingHash: StreamingHash;
    lastSignature: Signature;
};

export type PrivateTransaction = {
    privacy: "private";
    madeAt: number;
    keyUsed: KeyID;
    encryptedChanges: Encrypted<
        JsonValue[],
        { in: RawCoValueID; tx: TransactionID }
    >;
};

export type TrustingTransaction = {
    privacy: "trusting";
    madeAt: number;
    changes: JsonValue[];
};

export type Transaction = PrivateTransaction | TrustingTransaction;

export type DecryptedTransaction = {
    txID: TransactionID;
    changes: JsonValue[];
    madeAt: number;
};

export type TransactionID = { sessionID: SessionID; txIndex: number };

export class CoValue {
    id: RawCoValueID;
    node: LocalNode;
    header: CoValueHeader;
    sessions: { [key: SessionID]: SessionLog };
    content?: ContentType;

    constructor(header: CoValueHeader, node: LocalNode) {
        this.id = coValueIDforHeader(header);
        this.header = header;
        this.sessions = {};
        this.node = node;
    }

    testWithDifferentCredentials(
        agentCredential: AgentCredential,
        ownSessionID: SessionID
    ): CoValue {
        const newNode = this.node.testWithDifferentCredentials(
            agentCredential,
            ownSessionID
        );

        return newNode.expectCoValueLoaded(this.id);
    }

    knownState(): CoValueKnownState {
        return {
            coValueID: this.id,
            header: true,
            sessions: Object.fromEntries(
                Object.entries(this.sessions).map(([k, v]) => [
                    k,
                    v.transactions.length,
                ])
            ),
        };
    }

    get meta(): JsonValue {
        return this.header?.meta ?? null;
    }

    nextTransactionID(): TransactionID {
        const sessionID = this.node.ownSessionID;
        return {
            sessionID,
            txIndex: this.sessions[sessionID]?.transactions.length || 0,
        };
    }

    tryAddTransactions(
        sessionID: SessionID,
        newTransactions: Transaction[],
        newHash: Hash,
        newSignature: Signature
    ): boolean {
        const signatoryID =
            this.node.knownAgents[agentIDfromSessionID(sessionID)]?.signatoryID;

        if (!signatoryID) {
            console.warn("Unknown agent", agentIDfromSessionID(sessionID));
            return false;
        }

        const { expectedNewHash, newStreamingHash } = this.expectedNewHashAfter(
            sessionID,
            newTransactions
        );

        if (newHash !== expectedNewHash) {
            console.warn("Invalid hash", { newHash, expectedNewHash });
            return false;
        }

        if (!verify(newSignature, newHash, signatoryID)) {
            console.warn(
                "Invalid signature",
                newSignature,
                newHash,
                signatoryID
            );
            return false;
        }

        const transactions = this.sessions[sessionID]?.transactions ?? [];

        transactions.push(...newTransactions);

        this.sessions[sessionID] = {
            transactions,
            lastHash: newHash,
            streamingHash: newStreamingHash,
            lastSignature: newSignature,
        };

        this.content = undefined;

        this.node.syncCoValue(this);

        const _ = this.getCurrentContent();

        return true;
    }

    expectedNewHashAfter(
        sessionID: SessionID,
        newTransactions: Transaction[]
    ): { expectedNewHash: Hash; newStreamingHash: StreamingHash } {
        const streamingHash =
            this.sessions[sessionID]?.streamingHash.clone() ??
            new StreamingHash();
        for (const transaction of newTransactions) {
            streamingHash.update(transaction);
        }

        const newStreamingHash = streamingHash.clone();

        return {
            expectedNewHash: streamingHash.digest(),
            newStreamingHash,
        };
    }

    makeTransaction(
        changes: JsonValue[],
        privacy: "private" | "trusting"
    ): boolean {
        const madeAt = Date.now();

        let transaction: Transaction;

        if (privacy === "private") {
            const { secret: keySecret, id: keyID } = this.getCurrentReadKey();

            transaction = {
                privacy: "private",
                madeAt,
                keyUsed: keyID,
                encryptedChanges: encryptForTransaction(changes, keySecret, {
                    in: this.id,
                    tx: this.nextTransactionID(),
                }),
            };
        } else {
            transaction = {
                privacy: "trusting",
                madeAt,
                changes,
            };
        }

        const sessionID = this.node.ownSessionID;

        const { expectedNewHash } = this.expectedNewHashAfter(sessionID, [
            transaction,
        ]);

        const signature = sign(
            this.node.agentCredential.signatorySecret,
            expectedNewHash
        );

        return this.tryAddTransactions(
            sessionID,
            [transaction],
            expectedNewHash,
            signature
        );
    }

    getCurrentContent(): ContentType {
        if (this.content) {
            return this.content;
        }

        if (this.header.type === "comap") {
            this.content = new CoMap(this);
        } else if (this.header.type === "colist") {
            this.content = new CoList(this);
        } else if (this.header.type === "costream") {
            this.content = new CoStream(this);
        } else if (this.header.type === "static") {
            this.content = new Static(this);
        } else {
            throw new Error(`Unknown coValue type ${this.header.type}`);
        }

        return this.content;
    }

    getValidSortedTransactions(): DecryptedTransaction[] {
        const validTransactions = determineValidTransactions(this);

        const allTransactions: DecryptedTransaction[] = validTransactions.map(
            ({ txID, tx }) => {
                return {
                    txID,
                    madeAt: tx.madeAt,
                    changes:
                        tx.privacy === "private"
                            ? decryptForTransaction(
                                  tx.encryptedChanges,
                                  this.getReadKey(tx.keyUsed),
                                  {
                                      in: this.id,
                                      tx: txID,
                                  }
                              ) ||
                              (() => {
                                  throw new Error("Couldn't decrypt changes");
                              })()
                            : tx.changes,
                };
            }
        );
        allTransactions.sort(
            (a, b) =>
                a.madeAt - b.madeAt ||
                (a.txID.sessionID < b.txID.sessionID ? -1 : 1) ||
                a.txID.txIndex - b.txID.txIndex
        );

        return allTransactions;
    }

    getCurrentReadKey(): { secret: KeySecret; id: KeyID } {
        if (this.header.ruleset.type === "team") {
            const content = expectTeamContent(this.getCurrentContent());

            const currentKeyId = content.get("readKey")?.keyID;

            if (!currentKeyId) {
                throw new Error("No readKey set");
            }

            const secret = this.getReadKey(currentKeyId);

            return {
                secret: secret,
                id: currentKeyId,
            };
        } else if (this.header.ruleset.type === "ownedByTeam") {
            return this.node
                .expectCoValueLoaded(this.header.ruleset.team)
                .getCurrentReadKey();
        } else {
            throw new Error(
                "Only teams or values owned by teams have read secrets"
            );
        }
    }

    getReadKey(keyID: KeyID): KeySecret {
        if (this.header.ruleset.type === "team") {
            const content = expectTeamContent(this.getCurrentContent());

            const readKeyHistory = content.getHistory("readKey");

            // Try to find direct relevation of key for us

            for (const entry of readKeyHistory) {
                if (entry.value?.keyID === keyID) {
                    const revealer = agentIDfromSessionID(entry.txID.sessionID);
                    const revealerAgent = this.node.knownAgents[revealer];

                    if (!revealerAgent) {
                        throw new Error("Unknown revealer");
                    }

                    const secret = openAs(
                        entry.value.revelation,
                        this.node.agentCredential.recipientSecret,
                        revealerAgent.recipientID,
                        {
                            in: this.id,
                            tx: entry.txID,
                        }
                    );

                    if (secret) return secret as KeySecret;
                }
            }

            // Try to find indirect revelation through previousKeys

            for (const entry of readKeyHistory) {
                if (entry.value?.previousKeys?.[keyID]) {
                    const sealingKeyID = entry.value.keyID;
                    const sealingKeySecret = this.getReadKey(sealingKeyID);

                    if (!sealingKeySecret) {
                        continue;
                    }

                    const secret = unsealKeySecret(
                        {
                            sealed: keyID,
                            sealing: sealingKeyID,
                            encrypted: entry.value.previousKeys[keyID],
                        },
                        sealingKeySecret
                    );

                    if (secret) {
                        return secret;
                    } else {
                        console.error(
                            `Sealing ${sealingKeyID} key didn't unseal ${keyID}`
                        );
                    }
                }
            }

            throw new Error(
                "readKey " +
                    keyID +
                    " not revealed for " +
                    getAgentID(getAgent(this.node.agentCredential))
            );
        } else if (this.header.ruleset.type === "ownedByTeam") {
            return this.node
                .expectCoValueLoaded(this.header.ruleset.team)
                .getReadKey(keyID);
        } else {
            throw new Error(
                "Only teams or values owned by teams have read secrets"
            );
        }
    }

    getTx(txID: TransactionID): Transaction | undefined {
        return this.sessions[txID.sessionID]?.transactions[txID.txIndex];
    }

    newContentSince(knownState: CoValueKnownState | undefined): NewContentMessage | undefined {
        const newContent: NewContentMessage = {
            action: "newContent",
            coValueID: this.id,
            header: knownState?.header ? undefined : this.header,
            newContent: Object.fromEntries(
                Object.entries(this.sessions)
                    .map(([sessionID, log]) => {
                        const newTransactions = log.transactions.slice(
                            knownState?.sessions[sessionID as SessionID] || 0
                        );

                        if (
                            newTransactions.length === 0 ||
                            !log.lastHash ||
                            !log.lastSignature
                        ) {
                            return undefined;
                        }

                        return [
                            sessionID,
                            {
                                after:
                                    knownState?.sessions[
                                        sessionID as SessionID
                                    ] || 0,
                                newTransactions,
                                lastHash: log.lastHash,
                                lastSignature: log.lastSignature,
                            },
                        ];
                    })
                    .filter((x): x is Exclude<typeof x, undefined> => !!x)
            ),
        }

        if (!newContent.header && Object.keys(newContent.newContent).length === 0) {
            return undefined;
        }

        return newContent;
    }
}

export type AgentID = `agent_${string}`;

export type Agent = {
    signatoryID: SignatoryID;
    recipientID: RecipientID;
};

export function getAgent(agentCredential: AgentCredential) {
    return {
        signatoryID: getSignatoryID(agentCredential.signatorySecret),
        recipientID: getRecipientID(agentCredential.recipientSecret),
    };
}

export function getAgentCoValueHeader(agent: Agent): CoValueHeader {
    return {
        type: "comap",
        ruleset: {
            type: "agent",
            initialSignatoryID: agent.signatoryID,
            initialRecipientID: agent.recipientID,
        },
        meta: null,
    };
}

export function getAgentID(agent: Agent): AgentID {
    return `agent_${coValueIDforHeader(getAgentCoValueHeader(agent)).slice(
        "coval_".length
    )}`;
}

export function agentIDAsCoValueID(agentID: AgentID): RawCoValueID {
    return `coval_${agentID.substring("agent_".length)}`;
}

export type AgentCredential = {
    signatorySecret: SignatorySecret;
    recipientSecret: RecipientSecret;
};

export function newRandomAgentCredential(): AgentCredential {
    const signatorySecret = newRandomSignatory();
    const recipientSecret = newRandomRecipient();
    return { signatorySecret, recipientSecret };
}

// type Role = "admin" | "writer" | "reader";

// type PermissionsDef = CJMap<AgentID, Role, {[agent: AgentID]: Role}>;
