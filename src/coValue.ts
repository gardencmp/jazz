import { randomBytes } from "@noble/hashes/utils";
import { ContentType } from "./contentType";
import { Static } from "./contentTypes/static";
import { CoStream } from "./contentTypes/coStream";
import { CoMap } from "./contentTypes/coMap";
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
    signatorySecretToBytes,
    recipientSecretToBytes,
    signatorySecretFromBytes,
    recipientSecretFromBytes,
} from "./crypto";
import { JsonValue } from "./jsonValue";
import { base58 } from "@scure/base";
import {
    PermissionsDef as RulesetDef,
    Team,
    determineValidTransactions,
    expectTeamContent,
} from "./permissions";
import { LocalNode } from "./node";
import { CoValueKnownState, NewContentMessage } from "./sync";
import { AgentID, RawCoValueID, SessionID, TransactionID } from "./ids";
import { CoList } from "./contentTypes/coList";

export type CoValueHeader = {
    type: ContentType["type"];
    ruleset: RulesetDef;
    meta: JsonValue;
    createdAt: `2${string}` | null;
    uniqueness: `z${string}` | null;
    publicNickname?: string;
};

function coValueIDforHeader(header: CoValueHeader): RawCoValueID {
    const hash = shortHash(header);
    if (header.publicNickname) {
        return `co_${header.publicNickname}_z${hash.slice(
            "shortHash_z".length
        )}`;
    } else {
        return `co_z${hash.slice("shortHash_z".length)}`;
    }
}

export function agentIDfromSessionID(sessionID: SessionID): AgentID {
    return sessionID.split("_session")[0] as AgentID;
}

export function newRandomSessionID(agentID: AgentID): SessionID {
    return `${agentID}_session_z${base58.encode(randomBytes(8))}`;
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

export class CoValue {
    id: RawCoValueID;
    node: LocalNode;
    header: CoValueHeader;
    sessions: { [key: SessionID]: SessionLog };
    content?: ContentType;
    listeners: Set<(content?: ContentType) => void> = new Set();

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
        const signatoryID = this.node.expectAgentLoaded(
            agentIDfromSessionID(sessionID),
            "Expected to know signatory of transaction"
        ).signatoryID;

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

        const content = this.getCurrentContent();

        for (const listener of this.listeners) {
            listener(content);
        }

        return true;
    }

    subscribe(listener: (content?: ContentType) => void): () => void {
        this.listeners.add(listener);
        listener(this.getCurrentContent());

        return () => {
            this.listeners.delete(listener);
        };
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

            if (!keySecret) {
                throw new Error(
                    "Can't make transaction without read key secret"
                );
            }

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

        const success = this.tryAddTransactions(
            sessionID,
            [transaction],
            expectedNewHash,
            signature
        );

        if (success) {
            void this.node.sync.syncCoValue(this);
        }

        return success;
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

        const allTransactions: DecryptedTransaction[] = validTransactions
            .map(({ txID, tx }) => {
                if (tx.privacy === "trusting") {
                    return {
                        txID,
                        madeAt: tx.madeAt,
                        changes: tx.changes,
                    };
                } else {
                    const readKey = this.getReadKey(tx.keyUsed);

                    if (!readKey) {
                        return undefined;
                    } else {
                        const decrytedChanges = decryptForTransaction(
                            tx.encryptedChanges,
                            readKey,
                            {
                                in: this.id,
                                tx: txID,
                            }
                        );

                        if (!decrytedChanges) {
                            console.error(
                                "Failed to decrypt transaction despite having key"
                            );
                            return undefined;
                        }
                        return {
                            txID,
                            madeAt: tx.madeAt,
                            changes: decrytedChanges,
                        };
                    }
                }
            })
            .filter((x): x is Exclude<typeof x, undefined> => !!x);
        allTransactions.sort(
            (a, b) =>
                a.madeAt - b.madeAt ||
                (a.txID.sessionID < b.txID.sessionID ? -1 : 1) ||
                a.txID.txIndex - b.txID.txIndex
        );

        return allTransactions;
    }

    getCurrentReadKey(): { secret: KeySecret | undefined; id: KeyID } {
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

    getReadKey(keyID: KeyID): KeySecret | undefined {
        if (this.header.ruleset.type === "team") {
            const content = expectTeamContent(this.getCurrentContent());

            const readKeyHistory = content.getHistory("readKey");

            // Try to find direct relevation of key for us

            for (const entry of readKeyHistory) {
                if (entry.value?.keyID === keyID) {
                    const revealer = agentIDfromSessionID(entry.txID.sessionID);
                    const revealerAgent = this.node.expectAgentLoaded(
                        revealer,
                        "Expected to know revealer"
                    );

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
                const encryptedPreviousKey = entry.value?.previousKeys?.[keyID];
                if (entry.value && encryptedPreviousKey) {
                    const sealingKeyID = entry.value.keyID;
                    const sealingKeySecret = this.getReadKey(sealingKeyID);

                    if (!sealingKeySecret) {
                        continue;
                    }

                    const secret = unsealKeySecret(
                        {
                            sealed: keyID,
                            sealing: sealingKeyID,
                            encrypted: encryptedPreviousKey,
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

            return undefined;
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

    getTeam(): Team {
        if (this.header.ruleset.type !== "ownedByTeam") {
            throw new Error("Only values owned by teams have teams");
        }

        return new Team(
            expectTeamContent(
                this.node
                    .expectCoValueLoaded(this.header.ruleset.team)
                    .getCurrentContent()
            ),
            this.node
        );
    }

    getTx(txID: TransactionID): Transaction | undefined {
        return this.sessions[txID.sessionID]?.transactions[txID.txIndex];
    }

    newContentSince(
        knownState: CoValueKnownState | undefined
    ): NewContentMessage | undefined {
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
        };

        if (
            !newContent.header &&
            Object.keys(newContent.newContent).length === 0
        ) {
            return undefined;
        }

        return newContent;
    }

    getDependedOnCoValues(): RawCoValueID[] {
        return this.header.ruleset.type === "team"
            ? expectTeamContent(this.getCurrentContent())
                  .keys()
                  .filter((k): k is AgentID => k.startsWith("co_agent"))
            : this.header.ruleset.type === "ownedByTeam"
            ? [this.header.ruleset.team]
            : [];
    }
}

export type Agent = {
    signatoryID: SignatoryID;
    recipientID: RecipientID;
    publicNickname?: string;
};

export function getAgent(agentCredential: AgentCredential) {
    return {
        signatoryID: getSignatoryID(agentCredential.signatorySecret),
        recipientID: getRecipientID(agentCredential.recipientSecret),
        publicNickname: agentCredential.publicNickname,
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
        createdAt: null,
        uniqueness: null,
        publicNickname:
            "agent" + (agent.publicNickname ? `-${agent.publicNickname}` : ""),
    };
}

export function getAgentID(agent: Agent): AgentID {
    return coValueIDforHeader(getAgentCoValueHeader(agent)) as AgentID;
}

export type AgentCredential = {
    signatorySecret: SignatorySecret;
    recipientSecret: RecipientSecret;
    publicNickname?: string;
};

export function newRandomAgentCredential(
    publicNickname?: string
): AgentCredential {
    const signatorySecret = newRandomSignatory();
    const recipientSecret = newRandomRecipient();
    return { signatorySecret, recipientSecret, publicNickname };
}

export function agentCredentialToBytes(cred: AgentCredential): Uint8Array {
    if (cred.publicNickname) {
        throw new Error("Can't convert agent credential with publicNickname");
    }
    const bytes = new Uint8Array(64);
    const signatorySecretBytes = signatorySecretToBytes(cred.signatorySecret);
    if (signatorySecretBytes.length !== 32) {
        throw new Error("Invalid signatorySecret length");
    }
    bytes.set(signatorySecretBytes);
    const recipientSecretBytes = recipientSecretToBytes(cred.recipientSecret);
    if (recipientSecretBytes.length !== 32) {
        throw new Error("Invalid recipientSecret length");
    }
    bytes.set(recipientSecretBytes, 32);

    return bytes;
}

export function agentCredentialFromBytes(
    bytes: Uint8Array
): AgentCredential | undefined {
    if (bytes.length !== 64) {
        return undefined;
    }

    const signatorySecret = signatorySecretFromBytes(bytes.slice(0, 32));
    const recipientSecret = recipientSecretFromBytes(bytes.slice(32));

    return { signatorySecret, recipientSecret };
}

// type Role = "admin" | "writer" | "reader";

// type PermissionsDef = CJMap<AgentID, Role, {[agent: AgentID]: Role}>;
