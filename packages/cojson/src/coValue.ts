import { randomBytes } from "@noble/hashes/utils";
import { ContentType } from "./contentType.js";
import { Static } from "./contentTypes/static.js";
import { CoStream } from "./contentTypes/coStream.js";
import { CoMap } from "./contentTypes/coMap.js";
import {
    Encrypted,
    Hash,
    KeySecret,
    Signature,
    StreamingHash,
    unseal,
    shortHash,
    sign,
    verify,
    encryptForTransaction,
    decryptForTransaction,
    KeyID,
    decryptKeySecret,
    getAgentSignerID,
    getAgentSealerID,
} from "./crypto.js";
import { JsonObject, JsonValue } from "./jsonValue.js";
import { base58 } from "@scure/base";
import {
    PermissionsDef as RulesetDef,
    Team,
    determineValidTransactions,
    expectTeamContent,
    isKeyForKeyField,
} from "./permissions.js";
import { LocalNode } from "./node.js";
import { CoValueKnownState, NewContentMessage } from "./sync.js";
import { RawCoID, SessionID, TransactionID } from "./ids.js";
import { CoList } from "./contentTypes/coList.js";
import {
    AccountID,
    AccountIDOrAgentID,
    GeneralizedControlledAccount,
} from "./account.js";

export type CoValueHeader = {
    type: ContentType["type"];
    ruleset: RulesetDef;
    meta: JsonObject | null;
    createdAt: `2${string}` | null;
    uniqueness: `z${string}` | null;
};

export function idforHeader(header: CoValueHeader): RawCoID {
    const hash = shortHash(header);
    return `co_z${hash.slice("shortHash_z".length)}`;
}

export function accountOrAgentIDfromSessionID(
    sessionID: SessionID
): AccountIDOrAgentID {
    return sessionID.split("_session")[0] as AccountIDOrAgentID;
}

export function newRandomSessionID(accountID: AccountIDOrAgentID): SessionID {
    return `${accountID}_session_z${base58.encode(randomBytes(8))}`;
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
        { in: RawCoID; tx: TransactionID }
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
    id: RawCoID;
    node: LocalNode;
    header: CoValueHeader;
    sessions: { [key: SessionID]: SessionLog };
    _cachedContent?: ContentType;
    listeners: Set<(content?: ContentType) => void> = new Set();

    constructor(header: CoValueHeader, node: LocalNode) {
        this.id = idforHeader(header);
        this.header = header;
        this.sessions = {};
        this.node = node;
    }

    testWithDifferentAccount(
        account: GeneralizedControlledAccount,
        ownSessionID: SessionID
    ): CoValue {
        const newNode = this.node.testWithDifferentAccount(
            account,
            ownSessionID
        );

        return newNode.expectCoValueLoaded(this.id);
    }

    knownState(): CoValueKnownState {
        return {
            id: this.id,
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
        givenExpectedNewHash: Hash | undefined,
        newSignature: Signature
    ): boolean {
        const signerID = getAgentSignerID(
            this.node.resolveAccountAgent(
                accountOrAgentIDfromSessionID(sessionID),
                "Expected to know signer of transaction"
            )
        );

        if (!signerID) {
            console.warn(
                "Unknown agent",
                accountOrAgentIDfromSessionID(sessionID)
            );
            return false;
        }

        const { expectedNewHash, newStreamingHash } = this.expectedNewHashAfter(
            sessionID,
            newTransactions
        );

        if (givenExpectedNewHash && givenExpectedNewHash !== expectedNewHash) {
            console.warn("Invalid hash", { expectedNewHash, givenExpectedNewHash });
            return false;
        }

        if (!verify(newSignature, expectedNewHash, signerID)) {
            console.warn(
                "Invalid signature",
                newSignature,
                expectedNewHash,
                signerID
            );
            return false;
        }

        const transactions = this.sessions[sessionID]?.transactions ?? [];

        transactions.push(...newTransactions);

        this.sessions[sessionID] = {
            transactions,
            lastHash: expectedNewHash,
            streamingHash: newStreamingHash,
            lastSignature: newSignature,
        };

        this._cachedContent = undefined;

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
            this.node.account.currentSignerSecret(),
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
        if (this._cachedContent) {
            return this._cachedContent;
        }

        if (this.header.type === "comap") {
            this._cachedContent = new CoMap(this);
        } else if (this.header.type === "colist") {
            this._cachedContent = new CoList(this);
        } else if (this.header.type === "costream") {
            this._cachedContent = new CoStream(this);
        } else if (this.header.type === "static") {
            this._cachedContent = new Static(this);
        } else {
            throw new Error(`Unknown coValue type ${this.header.type}`);
        }

        return this._cachedContent;
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

            const currentKeyId = content.get("readKey");

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

            // Try to find key revelation for us

            const readKeyEntry = content.getLastEntry(`${keyID}_for_${this.node.account.id}`);

            if (readKeyEntry) {
                const revealer = accountOrAgentIDfromSessionID(
                    readKeyEntry.txID.sessionID
                );
                const revealerAgent = this.node.resolveAccountAgent(
                    revealer,
                    "Expected to know revealer"
                );

                const secret = unseal(
                    readKeyEntry.value,
                    this.node.account.currentSealerSecret(),
                    getAgentSealerID(revealerAgent),
                    {
                        in: this.id,
                        tx: readKeyEntry.txID,
                    }
                );

                if (secret) return secret as KeySecret;
            }

            // Try to find indirect revelation through previousKeys

            for (const field of content.keys()) {
                if (isKeyForKeyField(field) && field.startsWith(keyID)) {
                    const encryptingKeyID = field.split("_for_")[1] as KeyID;
                    const encryptingKeySecret = this.getReadKey(encryptingKeyID);

                    if (!encryptingKeySecret) {
                        continue;
                    }

                    const encryptedPreviousKey = content.get(field)!;

                    const secret = decryptKeySecret(
                        {
                            encryptedID: keyID,
                            encryptingID: encryptingKeyID,
                            encrypted: encryptedPreviousKey,
                        },
                        encryptingKeySecret
                    );

                    if (secret) {
                        return secret;
                    } else {
                        console.error(
                            `Encrypting ${encryptingKeyID} key didn't decrypt ${keyID}`
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
            action: "content",
            id: this.id,
            header: knownState?.header ? undefined : this.header,
            new: Object.fromEntries(
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
                                lastSignature: log.lastSignature,
                            },
                        ];
                    })
                    .filter((x): x is Exclude<typeof x, undefined> => !!x)
            ),
        };

        if (
            !newContent.header &&
            Object.keys(newContent.new).length === 0
        ) {
            return undefined;
        }

        return newContent;
    }

    getDependedOnCoValues(): RawCoID[] {
        return this.header.ruleset.type === "team"
            ? expectTeamContent(this.getCurrentContent())
                  .keys()
                  .filter((k): k is AccountID => k.startsWith("co_"))
            : this.header.ruleset.type === "ownedByTeam"
            ? [this.header.ruleset.team]
            : [];
    }
}