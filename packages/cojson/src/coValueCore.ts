import { randomBytes } from "@noble/hashes/utils";
import { AnyCoValue, CoValue } from "./coValue.js";
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
import { Group } from "./coValues/group.js";
import { LocalNode } from "./localNode.js";
import { CoValueKnownState, NewContentMessage } from "./sync.js";
import { AgentID, RawCoID, SessionID, TransactionID } from "./ids.js";
import {
    AccountID,
    GeneralizedControlledAccount,
} from "./coValues/account.js";
import { Stringified, stableStringify } from "./jsonStringify.js";
import { coreToCoValue } from "./coreToCoValue.js";
import { expectGroup } from "./typeUtils/expectGroup.js";
import { isAccountID } from "./typeUtils/isAccountID.js";
import { accountOrAgentIDfromSessionID } from "./typeUtils/accountOrAgentIDfromSessionID.js";

export const MAX_RECOMMENDED_TX_SIZE = 100 * 1024;

export type CoValueHeader = {
    type: AnyCoValue["type"];
    ruleset: RulesetDef;
    meta: JsonObject | null;
    createdAt: `2${string}` | null;
    uniqueness: `z${string}` | null;
};

export function idforHeader(header: CoValueHeader): RawCoID {
    const hash = shortHash(header);
    return `co_z${hash.slice("shortHash_z".length)}`;
}

export function newRandomSessionID(accountID: AccountID | AgentID): SessionID {
    return `${accountID}_session_z${base58.encode(randomBytes(8))}`;
}

type SessionLog = {
    transactions: Transaction[];
    lastHash?: Hash;
    streamingHash: StreamingHash;
    signatureAfter: { [txIdx: number]: Signature | undefined };
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
    _cachedContent?: CoValue;
    listeners: Set<(content?: CoValue) => void> = new Set();
    _decryptionCache: {
        [key: Encrypted<JsonValue[], JsonValue>]:
            | Stringified<JsonValue[]>
            | undefined;
    } = {};

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
        // This is an ugly hack to get a unique but stable session ID for editing the current account
        const sessionID =
            this.header.meta?.type === "account"
                ? (this.node.currentSessionID.replace(
                      this.node.account.id,
                      this.node.account.currentAgentID()
                  ) as SessionID)
                : this.node.currentSessionID;

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
                "Invalid signature in",
                this.id,
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

        this.doAddTransactions(
            sessionID,
            newTransactions,
            newSignature,
            expectedNewHash,
            newStreamingHash
        );

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
        const { expectedNewHash, newStreamingHash } =
            await this.expectedNewHashAfterAsync(sessionID, newTransactions);
        // const afterHash = performance.now();
        // console.log(
        //     "Hashing took",
        //     afterHash - beforeHash
        // );

        const nTxAfter = this.sessions[sessionID]?.transactions.length ?? 0;

        if (nTxAfter !== nTxBefore) {
            const newTransactionLengthBefore = newTransactions.length;
            newTransactions = newTransactions.slice(nTxAfter - nTxBefore);
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
                "Invalid signature in",
                this.id,
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

        this.doAddTransactions(
            sessionID,
            newTransactions,
            newSignature,
            expectedNewHash,
            newStreamingHash
        );

        return true;
    }

    private doAddTransactions(
        sessionID: SessionID,
        newTransactions: Transaction[],
        newSignature: Signature,
        expectedNewHash: Hash,
        newStreamingHash: StreamingHash
    ) {
        const transactions = this.sessions[sessionID]?.transactions ?? [];
        transactions.push(...newTransactions);

        const signatureAfter = this.sessions[sessionID]?.signatureAfter ?? {};

        const lastInbetweenSignatureIdx = Object.keys(signatureAfter).reduce(
            (max, idx) => (parseInt(idx) > max ? parseInt(idx) : max),
            -1
        );

        const sizeOfTxsSinceLastInbetweenSignature = transactions
            .slice(lastInbetweenSignatureIdx + 1)
            .reduce(
                (sum, tx) =>
                    sum +
                    (tx.privacy === "private"
                        ? tx.encryptedChanges.length
                        : tx.changes.length),
                0
            );

        if (sizeOfTxsSinceLastInbetweenSignature > 100 * 1024) {
            // console.log(
            //     "Saving inbetween signature for tx ",
            //     sessionID,
            //     transactions.length - 1,
            //     sizeOfTxsSinceLastInbetweenSignature
            // );
            signatureAfter[transactions.length - 1] = newSignature;
        }

        this._sessions[sessionID] = {
            transactions,
            lastHash: expectedNewHash,
            streamingHash: newStreamingHash,
            lastSignature: newSignature,
            signatureAfter: signatureAfter,
        };

        this._cachedContent = undefined;

        if (this.listeners.size > 0) {
            const content = this.getCurrentContent();
            for (const listener of this.listeners) {
                listener(content);
            }
        }
    }

    subscribe(listener: (content?: CoValue) => void): () => void {
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
            streamingHash.update(transaction);
            const after = performance.now();
            if (after - before > 1) {
                // console.log("Hashing blocked for", after - before);
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

        // This is an ugly hack to get a unique but stable session ID for editing the current account
        const sessionID =
            this.header.meta?.type === "account"
                ? (this.node.currentSessionID.replace(
                      this.node.account.id,
                      this.node.account.currentAgentID()
                  ) as SessionID)
                : this.node.currentSessionID;

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
            void this.node.syncManager.syncCoValue(this);
        }

        return success;
    }

    getCurrentContent(options?: { ignorePrivateTransactions: true }): CoValue {
        if (!options?.ignorePrivateTransactions && this._cachedContent) {
            return this._cachedContent;
        }

        const newContent = coreToCoValue(this, options);

        if (!options?.ignorePrivateTransactions) {
            this._cachedContent = newContent;
        }

        return newContent;
    }

    getValidSortedTransactions(options?: {
        ignorePrivateTransactions: true;
    }): DecryptedTransaction[] {
        const validTransactions = determineValidTransactions(this);

        const allTransactions: DecryptedTransaction[] = validTransactions
            .flatMap(({ txID, tx }) => {
                if (tx.privacy === "trusting") {
                    return {
                        txID,
                        madeAt: tx.madeAt,
                        changes: tx.changes,
                    };
                } else {
                    if (options?.ignorePrivateTransactions) {
                        return undefined;
                    }
                    const readKey = this.getReadKey(tx.keyUsed);

                    if (!readKey) {
                        return undefined;
                    } else {
                        let decrytedChanges =
                            this._decryptionCache[tx.encryptedChanges];

                        if (!decrytedChanges) {
                            decrytedChanges = decryptRawForTransaction(
                                tx.encryptedChanges,
                                readKey,
                                {
                                    in: this.id,
                                    tx: txID,
                                }
                            );
                            this._decryptionCache[tx.encryptedChanges] =
                                decrytedChanges;
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
            const content = expectGroup(this.getCurrentContent());

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
        let key = readKeyCache.get(this)?.[keyID];
        if (!key) {
            key = this.getUncachedReadKey(keyID);
            if (key) {
                let cache = readKeyCache.get(this);
                if (!cache) {
                    cache = {};
                    readKeyCache.set(this, cache);
                }
                cache[keyID] = key;
            }
        }
        return key;
    }

    getUncachedReadKey(keyID: KeyID): KeySecret | undefined {
        if (this.header.ruleset.type === "group") {
            const content = expectGroup(
                this.getCurrentContent({ ignorePrivateTransactions: true })
            );

            const keyForEveryone = content.get(`${keyID}_for_everyone`);
            if (keyForEveryone) return keyForEveryone;

            // Try to find key revelation for us
            const lookupAccountOrAgentID =
                this.header.meta?.type === "account"
                    ? this.node.account.currentAgentID()
                    : this.node.account.id;

            const lastReadyKeyEdit = content.lastEditAt(
                `${keyID}_for_${lookupAccountOrAgentID}`
            );

            if (lastReadyKeyEdit?.value) {
                const revealer = lastReadyKeyEdit.by;
                const revealerAgent = this.node.resolveAccountAgent(
                    revealer,
                    "Expected to know revealer"
                );

                const secret = unseal(
                    lastReadyKeyEdit.value,
                    this.node.account.currentSealerSecret(),
                    getAgentSealerID(revealerAgent),
                    {
                        in: this.id,
                        tx: lastReadyKeyEdit.tx,
                    }
                );

                if (secret) {
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

        return expectGroup(
            this.node
                .expectCoValueLoaded(this.header.ruleset.group)
                .getCurrentContent()
        );
    }

    getTx(txID: TransactionID): Transaction | undefined {
        return this.sessions[txID.sessionID]?.transactions[txID.txIndex];
    }

    newContentSince(
        knownState: CoValueKnownState | undefined
    ): NewContentMessage[] | undefined {
        let currentPiece: NewContentMessage = {
            action: "content",
            id: this.id,
            header: knownState?.header ? undefined : this.header,
            new: {},
        };

        const pieces = [currentPiece];

        const sentState: CoValueKnownState["sessions"] = {
            ...knownState?.sessions,
        };

        let newTxsWereAdded = true;
        let pieceSize = 0;
        while (newTxsWereAdded) {
            newTxsWereAdded = false;

            for (const [sessionID, log] of Object.entries(this.sessions) as [
                SessionID,
                SessionLog
            ][]) {
                const nextKnownSignatureIdx = Object.keys(log.signatureAfter)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .find((idx) => idx >= (sentState[sessionID] ?? -1));

                const txsToAdd = log.transactions.slice(
                    sentState[sessionID] ?? 0,
                    nextKnownSignatureIdx === undefined
                        ? undefined
                        : nextKnownSignatureIdx + 1
                );

                if (txsToAdd.length === 0) continue;

                newTxsWereAdded = true;

                const oldPieceSize = pieceSize;
                pieceSize += txsToAdd.reduce(
                    (sum, tx) =>
                        sum +
                        (tx.privacy === "private"
                            ? tx.encryptedChanges.length
                            : tx.changes.length),
                    0
                );

                if (pieceSize >= MAX_RECOMMENDED_TX_SIZE) {
                    currentPiece = {
                        action: "content",
                        id: this.id,
                        header: undefined,
                        new: {},
                    };
                    pieces.push(currentPiece);
                    pieceSize = pieceSize - oldPieceSize;
                }

                let sessionEntry = currentPiece.new[sessionID];
                if (!sessionEntry) {
                    sessionEntry = {
                        after: sentState[sessionID] ?? 0,
                        newTransactions: [],
                        lastSignature: "WILL_BE_REPLACED" as Signature,
                    };
                    currentPiece.new[sessionID] = sessionEntry;
                }

                sessionEntry.newTransactions.push(...txsToAdd);
                sessionEntry.lastSignature =
                    nextKnownSignatureIdx === undefined
                        ? log.lastSignature!
                        : log.signatureAfter[nextKnownSignatureIdx]!;

                sentState[sessionID] =
                    (sentState[sessionID] || 0) + txsToAdd.length;
            }
        }

        const piecesWithContent = pieces.filter(
            (piece) => Object.keys(piece.new).length > 0 || piece.header
        );

        if (piecesWithContent.length === 0) {
            return undefined;
        }

        return piecesWithContent;
    }

    getDependedOnCoValues(): RawCoID[] {
        return this.header.ruleset.type === "group"
            ? expectGroup(this.getCurrentContent())
                  .keys()
                  .filter((k): k is AccountID => k.startsWith("co_"))
            : this.header.ruleset.type === "ownedByGroup"
            ? [
                  this.header.ruleset.group,
                  ...new Set(
                      Object.keys(this._sessions)
                          .map((sessionID) =>
                              accountOrAgentIDfromSessionID(
                                  sessionID as SessionID
                              )
                          )
                          .filter(
                              (session): session is AccountID =>
                                  isAccountID(session) && session !== this.id
                          )
                  ),
              ]
            : [];
    }
}
