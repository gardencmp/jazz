import { AnyRawCoValue, RawCoValue } from "./coValue.js";
import {
    Encrypted,
    Hash,
    KeySecret,
    Signature,
    StreamingHash,
    KeyID,
    CryptoProvider,
    SignerID,
} from "./crypto/crypto.js";
import { JsonObject, JsonValue } from "./jsonValue.js";
import { base58 } from "@scure/base";
import {
    PermissionsDef as RulesetDef,
    determineValidTransactions,
    isKeyForKeyField,
} from "./permissions.js";
import { RawGroup } from "./coValues/group.js";
import { LocalNode, ResolveAccountAgentError } from "./localNode.js";
import { CoValueKnownState, NewContentMessage } from "./sync.js";
import { AgentID, RawCoID, SessionID, TransactionID } from "./ids.js";
import { AccountID, ControlledAccountOrAgent } from "./coValues/account.js";
import { Stringified, parseJSON, stableStringify } from "./jsonStringify.js";
import { coreToCoValue } from "./coreToCoValue.js";
import { expectGroup } from "./typeUtils/expectGroup.js";
import { isAccountID } from "./typeUtils/isAccountID.js";
import { accountOrAgentIDfromSessionID } from "./typeUtils/accountOrAgentIDfromSessionID.js";
import { err, ok, Result } from "neverthrow";

/**
    In order to not block other concurrently syncing CoValues we introduce a maximum size of transactions,
    since they are the smallest unit of progress that can be synced within a CoValue.
    This is particularly important for storing binary data in CoValues, since they are likely to be at least on the order of megabytes.
    This also means that we want to keep signatures roughly after each MAX_RECOMMENDED_TX size chunk,
    to be able to verify partially loaded CoValues or CoValues that are still being created (like a video live stream).
**/
export const MAX_RECOMMENDED_TX_SIZE = 100 * 1024;

export type CoValueHeader = {
    type: AnyRawCoValue["type"];
    ruleset: RulesetDef;
    meta: JsonObject | null;
    createdAt: `2${string}` | null;
    uniqueness: `z${string}` | null;
};

export function idforHeader(
    header: CoValueHeader,
    crypto: CryptoProvider,
): RawCoID {
    const hash = crypto.shortHash(header);
    return `co_z${hash.slice("shortHash_z".length)}`;
}

export function newRandomSessionID(accountID: AccountID | AgentID): SessionID {
    return `${accountID}_session_z${base58.encode(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).crypto.getRandomValues(new Uint8Array(8)),
    )}`;
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
    changes: JsonValue[];
    madeAt: number;
};

const readKeyCache = new WeakMap<CoValueCore, { [id: KeyID]: KeySecret }>();

export class CoValueCore {
    id: RawCoID;
    node: LocalNode;
    crypto: CryptoProvider;
    header: CoValueHeader;
    _sessionLogs: Map<SessionID, SessionLog>;
    _cachedContent?: RawCoValue;
    listeners: Set<(content?: RawCoValue) => void> = new Set();
    _decryptionCache: {
        [key: Encrypted<JsonValue[], JsonValue>]: JsonValue[] | undefined;
    } = {};
    _cachedKnownState?: CoValueKnownState;
    _cachedDependentOn?: RawCoID[];
    _cachedNewContentSinceEmpty?: NewContentMessage[] | undefined;
    _currentAsyncAddTransaction?: Promise<void>;

    constructor(
        header: CoValueHeader,
        node: LocalNode,
        internalInitSessions: Map<SessionID, SessionLog> = new Map(),
    ) {
        this.crypto = node.crypto;
        this.id = idforHeader(header, node.crypto);
        this.header = header;
        this._sessionLogs = internalInitSessions;
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

    get sessionLogs(): Map<SessionID, SessionLog> {
        return this._sessionLogs;
    }

    testWithDifferentAccount(
        account: ControlledAccountOrAgent,
        currentSessionID: SessionID,
    ): CoValueCore {
        const newNode = this.node.testWithDifferentAccount(
            account,
            currentSessionID,
        );

        return newNode.expectCoValueLoaded(this.id);
    }

    knownState(): CoValueKnownState {
        if (this._cachedKnownState) {
            return this._cachedKnownState;
        } else {
            const knownState = this.knownStateUncached();
            this._cachedKnownState = knownState;
            return knownState;
        }
    }

    /** @internal */
    knownStateUncached(): CoValueKnownState {
        return {
            id: this.id,
            header: true,
            sessions: Object.fromEntries(
                [...this.sessionLogs.entries()].map(([k, v]) => [
                    k,
                    v.transactions.length,
                ]),
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
                      this.node.account
                          .currentAgentID()
                          ._unsafeUnwrap({ withStackTrace: true }),
                  ) as SessionID)
                : this.node.currentSessionID;

        return {
            sessionID,
            txIndex: this.sessionLogs.get(sessionID)?.transactions.length || 0,
        };
    }

    tryAddTransactions(
        sessionID: SessionID,
        newTransactions: Transaction[],
        givenExpectedNewHash: Hash | undefined,
        newSignature: Signature,
    ): Result<true, TryAddTransactionsError> {
        return this.node
            .resolveAccountAgent(
                accountOrAgentIDfromSessionID(sessionID),
                "Expected to know signer of transaction",
            )
            .andThen((agent) => {
                const signerID = this.crypto.getAgentSignerID(agent);

                // const beforeHash = performance.now();
                const { expectedNewHash, newStreamingHash } =
                    this.expectedNewHashAfter(sessionID, newTransactions);
                // const afterHash = performance.now();
                // console.log(
                //     "Hashing took",
                //     afterHash - beforeHash
                // );

                if (
                    givenExpectedNewHash &&
                    givenExpectedNewHash !== expectedNewHash
                ) {
                    return err({
                        type: "InvalidHash",
                        id: this.id,
                        expectedNewHash,
                        givenExpectedNewHash,
                    } satisfies InvalidHashError);
                }

                // const beforeVerify = performance.now();
                if (
                    !this.crypto.verify(newSignature, expectedNewHash, signerID)
                ) {
                    return err({
                        type: "InvalidSignature",
                        id: this.id,
                        newSignature,
                        sessionID,
                        signerID,
                    } satisfies InvalidSignatureError);
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
                    newStreamingHash,
                    "immediate",
                );

                return ok(true as const);
            });
    }

    /*tryAddTransactionsAsync(
        sessionID: SessionID,
        newTransactions: Transaction[],
        givenExpectedNewHash: Hash | undefined,
        newSignature: Signature,
    ): ResultAsync<true, TryAddTransactionsError> {
        const currentAsyncAddTransaction = this._currentAsyncAddTransaction;
        let maybeAwaitPrevious:
            | ResultAsync<void, TryAddTransactionsError>
            | undefined;
        let thisDone = () => {};

        if (currentAsyncAddTransaction) {
            // eslint-disable-next-line neverthrow/must-use-result
            maybeAwaitPrevious = ResultAsync.fromSafePromise(
                currentAsyncAddTransaction,
            );
        } else {
            // eslint-disable-next-line neverthrow/must-use-result
            maybeAwaitPrevious = ResultAsync.fromSafePromise(Promise.resolve());
            this._currentAsyncAddTransaction = new Promise((resolve) => {
                thisDone = resolve;
            });
        }

        return maybeAwaitPrevious
            .andThen((_previousDone) =>
                this.node
                    .resolveAccountAgentAsync(
                        accountOrAgentIDfromSessionID(sessionID),
                        "Expected to know signer of transaction",
                    )
                    .andThen((agent) => {
                        const signerID = this.crypto.getAgentSignerID(agent);

                        const nTxBefore =
                            this.sessionLogs.get(sessionID)?.transactions
                                .length ?? 0;

                        // const beforeHash = performance.now();
                        return ResultAsync.fromSafePromise(
                            this.expectedNewHashAfterAsync(
                                sessionID,
                                newTransactions,
                            ),
                        ).andThen(({ expectedNewHash, newStreamingHash }) => {
                            // const afterHash = performance.now();
                            // console.log(
                            //     "Hashing took",
                            //     afterHash - beforeHash
                            // );

                            const nTxAfter =
                                this.sessionLogs.get(sessionID)?.transactions
                                    .length ?? 0;

                            if (nTxAfter !== nTxBefore) {
                                const newTransactionLengthBefore =
                                    newTransactions.length;
                                newTransactions = newTransactions.slice(
                                    nTxAfter - nTxBefore,
                                );
                                console.warn(
                                    "Transactions changed while async hashing",
                                    {
                                        nTxBefore,
                                        nTxAfter,
                                        newTransactionLengthBefore,
                                        remainingNewTransactions:
                                            newTransactions.length,
                                    },
                                );
                            }

                            if (
                                givenExpectedNewHash &&
                                givenExpectedNewHash !== expectedNewHash
                            ) {
                                return err({
                                    type: "InvalidHash",
                                    id: this.id,
                                    expectedNewHash,
                                    givenExpectedNewHash,
                                } satisfies InvalidHashError);
                            }

                            performance.mark("verifyStart" + this.id);
                            if (
                                !this.crypto.verify(
                                    newSignature,
                                    expectedNewHash,
                                    signerID,
                                )
                            ) {
                                return err({
                                    type: "InvalidSignature",
                                    id: this.id,
                                    newSignature,
                                    sessionID,
                                    signerID,
                                } satisfies InvalidSignatureError);
                            }
                            performance.mark("verifyEnd" + this.id);
                            performance.measure(
                                "verify" + this.id,
                                "verifyStart" + this.id,
                                "verifyEnd" + this.id,
                            );

                            this.doAddTransactions(
                                sessionID,
                                newTransactions,
                                newSignature,
                                expectedNewHash,
                                newStreamingHash,
                                "deferred",
                            );

                            return ok(true as const);
                        });
                    }),
            )
            .map((trueResult) => {
                thisDone();
                return trueResult;
            })
            .mapErr((err) => {
                thisDone();
                return err;
            });
    }*/

    private doAddTransactions(
        sessionID: SessionID,
        newTransactions: Transaction[],
        newSignature: Signature,
        expectedNewHash: Hash,
        newStreamingHash: StreamingHash,
        notifyMode: "immediate" | "deferred",
    ) {
        if (this.node.crashed) {
            throw new Error("Trying to add transactions after node is crashed");
        }
        const transactions =
            this.sessionLogs.get(sessionID)?.transactions ?? [];
        transactions.push(...newTransactions);

        const signatureAfter =
            this.sessionLogs.get(sessionID)?.signatureAfter ?? {};

        const lastInbetweenSignatureIdx = Object.keys(signatureAfter).reduce(
            (max, idx) => (parseInt(idx) > max ? parseInt(idx) : max),
            -1,
        );

        const sizeOfTxsSinceLastInbetweenSignature = transactions
            .slice(lastInbetweenSignatureIdx + 1)
            .reduce(
                (sum, tx) =>
                    sum +
                    (tx.privacy === "private"
                        ? tx.encryptedChanges.length
                        : tx.changes.length),
                0,
            );

        if (sizeOfTxsSinceLastInbetweenSignature > MAX_RECOMMENDED_TX_SIZE) {
            // console.log(
            //     "Saving inbetween signature for tx ",
            //     sessionID,
            //     transactions.length - 1,
            //     sizeOfTxsSinceLastInbetweenSignature
            // );
            signatureAfter[transactions.length - 1] = newSignature;
        }

        this._sessionLogs.set(sessionID, {
            transactions,
            lastHash: expectedNewHash,
            streamingHash: newStreamingHash,
            lastSignature: newSignature,
            signatureAfter: signatureAfter,
        });

        this._cachedContent = undefined;
        this._cachedKnownState = undefined;
        this._cachedDependentOn = undefined;
        this._cachedNewContentSinceEmpty = undefined;

        if (this.listeners.size > 0) {
            if (notifyMode === "immediate") {
                const content = this.getCurrentContent();
                for (const listener of this.listeners) {
                    listener(content);
                }
            } else {
                if (!this.nextDeferredNotify) {
                    this.nextDeferredNotify = new Promise((resolve) => {
                        setTimeout(() => {
                            this.nextDeferredNotify = undefined;
                            this.deferredUpdates = 0;
                            const content = this.getCurrentContent();
                            for (const listener of this.listeners) {
                                listener(content);
                            }
                            resolve();
                        }, 0);
                    });
                }
                this.deferredUpdates++;
            }
        }
    }

    deferredUpdates = 0;
    nextDeferredNotify: Promise<void> | undefined;

    subscribe(listener: (content?: RawCoValue) => void): () => void {
        this.listeners.add(listener);
        listener(this.getCurrentContent());

        return () => {
            this.listeners.delete(listener);
        };
    }

    expectedNewHashAfter(
        sessionID: SessionID,
        newTransactions: Transaction[],
    ): { expectedNewHash: Hash; newStreamingHash: StreamingHash } {
        const streamingHash =
            this.sessionLogs.get(sessionID)?.streamingHash.clone() ??
            new StreamingHash(this.crypto);
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
        newTransactions: Transaction[],
    ): Promise<{ expectedNewHash: Hash; newStreamingHash: StreamingHash }> {
        const streamingHash =
            this.sessionLogs.get(sessionID)?.streamingHash.clone() ??
            new StreamingHash(this.crypto);
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
        privacy: "private" | "trusting",
    ): boolean {
        const madeAt = Date.now();

        let transaction: Transaction;

        if (privacy === "private") {
            const { secret: keySecret, id: keyID } = this.getCurrentReadKey();

            if (!keySecret) {
                throw new Error(
                    "Can't make transaction without read key secret",
                );
            }

            const encrypted = this.crypto.encryptForTransaction(
                changes,
                keySecret,
                {
                    in: this.id,
                    tx: this.nextTransactionID(),
                },
            );

            this._decryptionCache[encrypted] = changes;

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
                      this.node.account
                          .currentAgentID()
                          ._unsafeUnwrap({ withStackTrace: true }),
                  ) as SessionID)
                : this.node.currentSessionID;

        const { expectedNewHash } = this.expectedNewHashAfter(sessionID, [
            transaction,
        ]);

        const signature = this.crypto.sign(
            this.node.account.currentSignerSecret(),
            expectedNewHash,
        );

        const success = this.tryAddTransactions(
            sessionID,
            [transaction],
            expectedNewHash,
            signature,
        )._unsafeUnwrap({ withStackTrace: true });

        if (success) {
            void this.node.syncManager.syncCoValue(this);
        }

        return success;
    }

    getCurrentContent(options?: {
        ignorePrivateTransactions: true;
    }): RawCoValue {
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
                        changes: parseJSON(tx.changes),
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
                            const decryptedString =
                                this.crypto.decryptRawForTransaction(
                                    tx.encryptedChanges,
                                    readKey,
                                    {
                                        in: this.id,
                                        tx: txID,
                                    },
                                );
                            decrytedChanges =
                                decryptedString && parseJSON(decryptedString);
                            this._decryptionCache[tx.encryptedChanges] =
                                decrytedChanges;
                        }

                        if (!decrytedChanges) {
                            console.error(
                                "Failed to decrypt transaction despite having key",
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
                a.txID.txIndex - b.txID.txIndex,
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
                "Only groups or values owned by groups have read secrets",
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
                this.getCurrentContent({ ignorePrivateTransactions: true }),
            );

            const keyForEveryone = content.get(`${keyID}_for_everyone`);
            if (keyForEveryone) return keyForEveryone;

            // Try to find key revelation for us
            const lookupAccountOrAgentID =
                this.header.meta?.type === "account"
                    ? this.node.account
                          .currentAgentID()
                          ._unsafeUnwrap({ withStackTrace: true })
                    : this.node.account.id;

            const lastReadyKeyEdit = content.lastEditAt(
                `${keyID}_for_${lookupAccountOrAgentID}`,
            );

            if (lastReadyKeyEdit?.value) {
                const revealer = lastReadyKeyEdit.by;
                const revealerAgent = this.node
                    .resolveAccountAgent(revealer, "Expected to know revealer")
                    ._unsafeUnwrap({ withStackTrace: true });

                const secret = this.crypto.unseal(
                    lastReadyKeyEdit.value,
                    this.node.account.currentSealerSecret(),
                    this.crypto.getAgentSealerID(revealerAgent),
                    {
                        in: this.id,
                        tx: lastReadyKeyEdit.tx,
                    },
                );

                if (secret) {
                    return secret as KeySecret;
                }
            }

            // Try to find indirect revelation through previousKeys

            for (const co of content.keys()) {
                if (isKeyForKeyField(co) && co.startsWith(keyID)) {
                    const encryptingKeyID = co.split("_for_")[1] as KeyID;
                    const encryptingKeySecret =
                        this.getReadKey(encryptingKeyID);

                    if (!encryptingKeySecret) {
                        continue;
                    }

                    const encryptedPreviousKey = content.get(co)!;

                    const secret = this.crypto.decryptKeySecret(
                        {
                            encryptedID: keyID,
                            encryptingID: encryptingKeyID,
                            encrypted: encryptedPreviousKey,
                        },
                        encryptingKeySecret,
                    );

                    if (secret) {
                        return secret as KeySecret;
                    } else {
                        console.error(
                            `Encrypting ${encryptingKeyID} key didn't decrypt ${keyID}`,
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
                "Only groups or values owned by groups have read secrets",
            );
        }
    }

    getGroup(): RawGroup {
        if (this.header.ruleset.type !== "ownedByGroup") {
            throw new Error("Only values owned by groups have groups");
        }

        return expectGroup(
            this.node
                .expectCoValueLoaded(this.header.ruleset.group)
                .getCurrentContent(),
        );
    }

    getTx(txID: TransactionID): Transaction | undefined {
        return this.sessionLogs.get(txID.sessionID)?.transactions[txID.txIndex];
    }

    newContentSince(
        knownState: CoValueKnownState | undefined,
    ): NewContentMessage[] | undefined {
        const isKnownStateEmpty = !knownState?.header && !knownState?.sessions;

        if (isKnownStateEmpty && this._cachedNewContentSinceEmpty) {
            return this._cachedNewContentSinceEmpty;
        }

        let currentPiece: NewContentMessage = {
            action: "content",
            id: this.id,
            header: knownState?.header ? undefined : this.header,
            new: {},
        };

        const pieces = [currentPiece];

        const sentState: CoValueKnownState["sessions"] = {};

        let pieceSize = 0;

        let sessionsTodoAgain: Set<SessionID> | undefined | "first" = "first";

        while (
            sessionsTodoAgain === "first" ||
            sessionsTodoAgain?.size ||
            0 > 0
        ) {
            if (sessionsTodoAgain === "first") {
                sessionsTodoAgain = undefined;
            }
            const sessionsTodo = sessionsTodoAgain ?? this.sessionLogs.keys();

            for (const sessionIDKey of sessionsTodo) {
                const sessionID = sessionIDKey as SessionID;
                const log = this.sessionLogs.get(sessionID)!;
                const knownStateForSessionID = knownState?.sessions[sessionID];
                const sentStateForSessionID = sentState[sessionID];
                const nextKnownSignatureIdx = getNextKnownSignatureIdx(
                    log,
                    knownStateForSessionID,
                    sentStateForSessionID,
                );

                const firstNewTxIdx =
                    sentStateForSessionID ?? knownStateForSessionID ?? 0;
                const afterLastNewTxIdx =
                    nextKnownSignatureIdx === undefined
                        ? log.transactions.length
                        : nextKnownSignatureIdx + 1;

                const nNewTx = Math.max(0, afterLastNewTxIdx - firstNewTxIdx);

                if (nNewTx === 0) {
                    sessionsTodoAgain?.delete(sessionID);
                    continue;
                }

                if (afterLastNewTxIdx < log.transactions.length) {
                    if (!sessionsTodoAgain) {
                        sessionsTodoAgain = new Set();
                    }
                    sessionsTodoAgain.add(sessionID);
                }

                const oldPieceSize = pieceSize;
                for (
                    let txIdx = firstNewTxIdx;
                    txIdx < afterLastNewTxIdx;
                    txIdx++
                ) {
                    const tx = log.transactions[txIdx]!;
                    pieceSize +=
                        tx.privacy === "private"
                            ? tx.encryptedChanges.length
                            : tx.changes.length;
                }

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
                        after:
                            sentStateForSessionID ??
                            knownStateForSessionID ??
                            0,
                        newTransactions: [],
                        lastSignature: "WILL_BE_REPLACED" as Signature,
                    };
                    currentPiece.new[sessionID] = sessionEntry;
                }

                for (
                    let txIdx = firstNewTxIdx;
                    txIdx < afterLastNewTxIdx;
                    txIdx++
                ) {
                    const tx = log.transactions[txIdx]!;
                    sessionEntry.newTransactions.push(tx);
                }

                sessionEntry.lastSignature =
                    nextKnownSignatureIdx === undefined
                        ? log.lastSignature!
                        : log.signatureAfter[nextKnownSignatureIdx]!;

                sentState[sessionID] =
                    (sentStateForSessionID ?? knownStateForSessionID ?? 0) +
                    nNewTx;
            }
        }

        const piecesWithContent = pieces.filter(
            (piece) => Object.keys(piece.new).length > 0 || piece.header,
        );

        if (piecesWithContent.length === 0) {
            return undefined;
        }

        if (isKnownStateEmpty) {
            this._cachedNewContentSinceEmpty = piecesWithContent;
        }

        return piecesWithContent;
    }

    getDependedOnCoValues(): RawCoID[] {
        if (this._cachedDependentOn) {
            return this._cachedDependentOn;
        } else {
            const dependentOn = this.getDependedOnCoValuesUncached();
            this._cachedDependentOn = dependentOn;
            return dependentOn;
        }
    }

    /** @internal */
    getDependedOnCoValuesUncached(): RawCoID[] {
        return this.header.ruleset.type === "group"
            ? expectGroup(this.getCurrentContent())
                  .keys()
                  .filter((k): k is AccountID => k.startsWith("co_"))
            : this.header.ruleset.type === "ownedByGroup"
              ? [
                    this.header.ruleset.group,
                    ...new Set(
                        [...this.sessionLogs.keys()]
                            .map((sessionID) =>
                                accountOrAgentIDfromSessionID(
                                    sessionID as SessionID,
                                ),
                            )
                            .filter(
                                (session): session is AccountID =>
                                    isAccountID(session) && session !== this.id,
                            ),
                    ),
                ]
              : [];
    }
}

function getNextKnownSignatureIdx(
    log: SessionLog,
    knownStateForSessionID?: number,
    sentStateForSessionID?: number,
) {
    return Object.keys(log.signatureAfter)
        .map(Number)
        .sort((a, b) => a - b)
        .find(
            (idx) =>
                idx >= (sentStateForSessionID ?? knownStateForSessionID ?? -1),
        );
}

export type InvalidHashError = {
    type: "InvalidHash";
    id: RawCoID;
    expectedNewHash: Hash;
    givenExpectedNewHash: Hash;
};

export type InvalidSignatureError = {
    type: "InvalidSignature";
    id: RawCoID;
    newSignature: Signature;
    sessionID: SessionID;
    signerID: SignerID;
};

export type TryAddTransactionsError =
    | ResolveAccountAgentError
    | InvalidHashError
    | InvalidSignatureError;
