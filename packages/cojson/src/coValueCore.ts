import { randomBytes } from "@noble/hashes/utils";
import { CoValueImpl } from "./coValue.js";
import { Static } from "./coValues/static.js";
import { BinaryCoStream, CoStream } from "./coValues/coStream.js";
import { CoMap } from "./coValues/coMap.js";
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
    decryptRawForTransaction,
} from "./crypto.js";
import { JsonObject, JsonValue } from "./jsonValue.js";
import { base58 } from "@scure/base";
import {
    PermissionsDef as RulesetDef,
    determineValidTransactions,
    isKeyForKeyField,
} from "./permissions.js";
import { Group, expectGroupContent } from "./group.js";
import { LocalNode } from "./node.js";
import { CoValueKnownState, NewContentMessage } from "./sync.js";
import { AgentID, RawCoID, SessionID, TransactionID } from "./ids.js";
import { CoList } from "./coValues/coList.js";
import {
    AccountID,
    GeneralizedControlledAccount,
} from "./account.js";
import { Stringified, parseJSON, stableStringify } from "./jsonStringify.js";

export type CoValueHeader = {
    type: CoValueImpl["type"];
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
): AccountID | AgentID {
    return sessionID.split("_session")[0] as AccountID | AgentID;
}

export function newRandomSessionID(accountID: AccountID | AgentID): SessionID {
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
    changes: Stringified<JsonValue[]>;
};

export type Transaction = PrivateTransaction | TrustingTransaction;

export type DecryptedTransaction = {
    txID: TransactionID;
    changes: Stringified<JsonValue[]>;
    madeAt: number;
};

const readKeyCache = new WeakMap<CoValueCore, { [id: KeyID]: KeySecret }>();

export class CoValueCore {
    id: RawCoID;
    node: LocalNode;
    header: CoValueHeader;
    _sessions: { [key: SessionID]: SessionLog };
    _cachedContent?: CoValueImpl;
    listeners: Set<(content?: CoValueImpl) => void> = new Set();
    _decryptionCache: {[key: Encrypted<JsonValue[], JsonValue>]: Stringified<JsonValue[]> | undefined} = {}

    constructor(
        header: CoValueHeader,
        node: LocalNode,
        internalInitSessions: { [key: SessionID]: SessionLog } = {}
    ) {
        this.id = idforHeader(header);
        this.header = header;
        this._sessions = internalInitSessions;
        this.node = node;

        if (header.ruleset.type == "ownedByGroup") {
            this.node
                .expectCoValueLoaded(header.ruleset.group)
                .subscribe((_groupUpdate) => {
                    this._cachedContent = undefined;
                    const newContent = this.getCurrentContent();
                    for (const listener of this.listeners) {
                        listener(newContent);
                    }
                });
        }
    }

    get sessions(): Readonly<{ [key: SessionID]: SessionLog }> {
        return this._sessions;
    }

    testWithDifferentAccount(
        account: GeneralizedControlledAccount,
        currentSessionID: SessionID
    ): CoValueCore {
        const newNode = this.node.testWithDifferentAccount(
            account,
            currentSessionID
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
        const sessionID = this.node.currentSessionID;
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

        // const beforeHash = performance.now();
        const { expectedNewHash, newStreamingHash } = this.expectedNewHashAfter(
            sessionID,
            newTransactions
        );
        // const afterHash = performance.now();
        // console.log(
        //     "Hashing took",
        //     afterHash - beforeHash
        // );

        if (givenExpectedNewHash && givenExpectedNewHash !== expectedNewHash) {
            console.warn("Invalid hash", {
                expectedNewHash,
                givenExpectedNewHash,
            });
            return false;
        }

        // const beforeVerify = performance.now();
        if (!verify(newSignature, expectedNewHash, signerID)) {
            console.warn(
                "Invalid signature",
                newSignature,
                expectedNewHash,
                signerID
            );
            return false;
        }
        // const afterVerify = performance.now();
        // console.log(
        //     "Verify took",
        //     afterVerify - beforeVerify
        // );

        const transactions = this.sessions[sessionID]?.transactions ?? [];

        transactions.push(...newTransactions);

        this._sessions[sessionID] = {
            transactions,
            lastHash: expectedNewHash,
            streamingHash: newStreamingHash,
            lastSignature: newSignature,
        };

        this._cachedContent = undefined;

        if (this.listeners.size > 0) {
            const content = this.getCurrentContent();
            for (const listener of this.listeners) {
                listener(content);
            }
        }

        return true;
    }

    async tryAddTransactionsAsync(
        sessionID: SessionID,
        newTransactions: Transaction[],
        givenExpectedNewHash: Hash | undefined,
        newSignature: Signature
    ): Promise<boolean> {
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

        const nTxBefore = this.sessions[sessionID]?.transactions.length ?? 0;

        // const beforeHash = performance.now();
        const { expectedNewHash, newStreamingHash } = await this.expectedNewHashAfterAsync(
            sessionID,
            newTransactions
        );
        // const afterHash = performance.now();
        // console.log(
        //     "Hashing took",
        //     afterHash - beforeHash
        // );

        const nTxAfter = this.sessions[sessionID]?.transactions.length ?? 0;

        if (nTxAfter !== nTxBefore) {
            const newTransactionLengthBefore = newTransactions.length;
            newTransactions = newTransactions.slice((nTxAfter - nTxBefore));
            console.warn("Transactions changed while async hashing", {
                nTxBefore,
                nTxAfter,
                newTransactionLengthBefore,
                remainingNewTransactions: newTransactions.length,
            });
        }

        if (givenExpectedNewHash && givenExpectedNewHash !== expectedNewHash) {
            console.warn("Invalid hash", {
                expectedNewHash,
                givenExpectedNewHash,
            });
            return false;
        }

        // const beforeVerify = performance.now();
        if (!verify(newSignature, expectedNewHash, signerID)) {
            console.warn(
                "Invalid signature",
                newSignature,
                expectedNewHash,
                signerID
            );
            return false;
        }
        // const afterVerify = performance.now();
        // console.log(
        //     "Verify took",
        //     afterVerify - beforeVerify
        // );

        const transactions = this.sessions[sessionID]?.transactions ?? [];

        transactions.push(...newTransactions);

        this._sessions[sessionID] = {
            transactions,
            lastHash: expectedNewHash,
            streamingHash: newStreamingHash,
            lastSignature: newSignature,
        };

        this._cachedContent = undefined;

        if (this.listeners.size > 0) {
            const content = this.getCurrentContent();
            for (const listener of this.listeners) {
                listener(content);
            }
        }

        return true;
    }

    subscribe(listener: (content?: CoValueImpl) => void): () => void {
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

    async expectedNewHashAfterAsync(
        sessionID: SessionID,
        newTransactions: Transaction[]
    ): Promise<{ expectedNewHash: Hash; newStreamingHash: StreamingHash }> {
        const streamingHash =
            this.sessions[sessionID]?.streamingHash.clone() ??
            new StreamingHash();
        let before = performance.now();
        for (const transaction of newTransactions) {
            streamingHash.update(transaction)
            const after = performance.now();
            if (after - before > 1) {
                console.log("Hashing blocked for", after - before);
                await new Promise((resolve) => setTimeout(resolve, 0));
                before = performance.now();
            }
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

            const encrypted = encryptForTransaction(changes, keySecret, {
                in: this.id,
                tx: this.nextTransactionID(),
            });

            this._decryptionCache[encrypted] = stableStringify(changes);

            transaction = {
                privacy: "private",
                madeAt,
                keyUsed: keyID,
                encryptedChanges: encrypted,
            };
        } else {
            transaction = {
                privacy: "trusting",
                madeAt,
                changes: stableStringify(changes),
            };
        }

        const sessionID = this.node.currentSessionID;

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

    getCurrentContent(): CoValueImpl {
        if (this._cachedContent) {
            return this._cachedContent;
        }

        if (this.header.type === "comap") {
            this._cachedContent = new CoMap(this);
        } else if (this.header.type === "colist") {
            this._cachedContent = new CoList(this);
        } else if (this.header.type === "costream") {
            if (this.header.meta && this.header.meta.type === "binary") {
                this._cachedContent = new BinaryCoStream(this);
            } else {
                this._cachedContent = new CoStream(this);
            }
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
                        let decrytedChanges = this._decryptionCache[tx.encryptedChanges];

                        if (!decrytedChanges) {
                            decrytedChanges = decryptRawForTransaction(
                                tx.encryptedChanges,
                                readKey,
                                {
                                    in: this.id,
                                    tx: txID,
                                }
                            );
                            this._decryptionCache[tx.encryptedChanges] = decrytedChanges;
                        }

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
        if (this.header.ruleset.type === "group") {
            const content = expectGroupContent(this.getCurrentContent());

            const currentKeyId = content.get("readKey");

            if (!currentKeyId) {
                throw new Error("No readKey set");
            }

            const secret = this.getReadKey(currentKeyId);

            return {
                secret: secret,
                id: currentKeyId,
            };
        } else if (this.header.ruleset.type === "ownedByGroup") {
            return this.node
                .expectCoValueLoaded(this.header.ruleset.group)
                .getCurrentReadKey();
        } else {
            throw new Error(
                "Only groups or values owned by groups have read secrets"
            );
        }
    }

    getReadKey(keyID: KeyID): KeySecret | undefined {
        if (readKeyCache.get(this)?.[keyID]) {
            return readKeyCache.get(this)?.[keyID];
        }
        if (this.header.ruleset.type === "group") {
            const content = expectGroupContent(this.getCurrentContent());

            // Try to find key revelation for us

            const readKeyEntry = content.getLastEntry(
                `${keyID}_for_${this.node.account.id}`
            );

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

                if (secret) {
                    let cache = readKeyCache.get(this);
                    if (!cache) {
                        cache = {};
                        readKeyCache.set(this, cache);
                    }
                    cache[keyID] = secret;

                    return secret as KeySecret;
                }
            }

            // Try to find indirect revelation through previousKeys

            for (const field of content.keys()) {
                if (isKeyForKeyField(field) && field.startsWith(keyID)) {
                    const encryptingKeyID = field.split("_for_")[1] as KeyID;
                    const encryptingKeySecret =
                        this.getReadKey(encryptingKeyID);

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
                        let cache = readKeyCache.get(this);
                        if (!cache) {
                            cache = {};
                            readKeyCache.set(this, cache);
                        }
                        cache[keyID] = secret;

                        return secret as KeySecret;
                    } else {
                        console.error(
                            `Encrypting ${encryptingKeyID} key didn't decrypt ${keyID}`
                        );
                    }
                }
            }

            return undefined;
        } else if (this.header.ruleset.type === "ownedByGroup") {
            return this.node
                .expectCoValueLoaded(this.header.ruleset.group)
                .getReadKey(keyID);
        } else {
            throw new Error(
                "Only groups or values owned by groups have read secrets"
            );
        }
    }

    getGroup(): Group {
        if (this.header.ruleset.type !== "ownedByGroup") {
            throw new Error("Only values owned by groups have groups");
        }

        return new Group(
            expectGroupContent(
                this.node
                    .expectCoValueLoaded(this.header.ruleset.group)
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

        if (!newContent.header && Object.keys(newContent.new).length === 0) {
            return undefined;
        }

        return newContent;
    }

    getDependedOnCoValues(): RawCoID[] {
        return this.header.ruleset.type === "group"
            ? expectGroupContent(this.getCurrentContent())
                  .keys()
                  .filter((k): k is AccountID => k.startsWith("co_"))
            : this.header.ruleset.type === "ownedByGroup"
            ? [this.header.ruleset.group]
            : [];
    }
}
