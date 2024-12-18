import { Result, err, ok } from "neverthrow";
import { AnyRawCoValue, RawCoValue } from "./coValue.js";
import { ControlledAccountOrAgent, RawAccountID } from "./coValues/account.js";
import { RawGroup } from "./coValues/group.js";
import { coreToCoValue } from "./coreToCoValue.js";
import {
  CryptoProvider,
  Encrypted,
  Hash,
  KeyID,
  KeySecret,
  Signature,
  SignerID,
  StreamingHash,
} from "./crypto/crypto.js";
import {
  RawCoID,
  SessionID,
  TransactionID,
  getGroupDependentKeyList,
  getParentGroupId,
  isParentGroupReference,
} from "./ids.js";
import { Stringified, parseJSON, stableStringify } from "./jsonStringify.js";
import { JsonObject, JsonValue } from "./jsonValue.js";
import { LocalNode, ResolveAccountAgentError } from "./localNode.js";
import {
  PermissionsDef as RulesetDef,
  determineValidTransactions,
  isKeyForKeyField,
} from "./permissions.js";
import { getPriorityFromHeader } from "./priority.js";
import { CoValueKnownState, NewContentMessage } from "./sync.js";
import { accountOrAgentIDfromSessionID } from "./typeUtils/accountOrAgentIDfromSessionID.js";
import { expectGroup } from "./typeUtils/expectGroup.js";
import { isAccountID } from "./typeUtils/isAccountID.js";

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
} & CoValueUniqueness;

export type CoValueUniqueness = {
  uniqueness: JsonValue;
  createdAt?: `2${string}` | null;
};

export function idforHeader(
  header: CoValueHeader,
  crypto: CryptoProvider,
): RawCoID {
  const hash = crypto.shortHash(header);
  return `co_z${hash.slice("shortHash_z".length)}`;
}

export type PrivateTransaction = {
  privacy: "private";
  madeAt: number;
  keyUsed: KeyID;
  encryptedChanges: Encrypted<JsonValue[], { in: RawCoID; tx: TransactionID }>;
};

export type TrustingTransaction = {
  privacy: "trusting";
  madeAt: number;
  changes: Stringified<JsonValue[]>;
};

type UnverifiedTransactionState = {
  type: "unverified";
  tx: PrivateTransaction | TrustingTransaction;
  receivedSignature?: Signature;
}

type HashedTransactionState = {
  type: "hashed";
  tx: PrivateTransaction | TrustingTransaction;
  hashAndReceivedSignature?: {
    hash: StreamingHash;
    signature: Signature;
  };
}

type VerificationFailedTransactionState = {
  type: "verificationFailed";
  tx: PrivateTransaction | TrustingTransaction;
  hashAndReceivedSignature: {
    hash: StreamingHash;
    signature: Signature;
  };
  error: Error;
}

type VerifiedTransactionState = {
  type: "verified";
  tx: PrivateTransaction | TrustingTransaction;
  hashAndReceivedSignature: {
    hash: StreamingHash;
    signature: Signature;
  };
  validInViewVersionRanges: {
    from: number;
    to: number | undefined;
  }[];
}

class TransactionEntry {
  state: UnverifiedTransactionState | HashedTransactionState | VerificationFailedTransactionState | VerifiedTransactionState;
  sessionID: SessionID;
  txIdx: number;

  constructor(sessionID: SessionID, txIdx: number, tx: PrivateTransaction | TrustingTransaction) {
    this.state = {
      type: "unverified",
      tx,
    };
    this.sessionID = sessionID;
    this.txIdx = txIdx;
  }

  hash(streamingHash: StreamingHash) {
    if (this.state.type !== "unverified") {
      throw new Error("Cannot hash transaction that is not unverified");
    }

    streamingHash.update(this.state.tx);

    const hashAndReceivedSignature = this.state.receivedSignature ? {
      hash: streamingHash.clone(),
      signature: this.state.receivedSignature,
    } : undefined;

    this.state = {
      type: "hashed",
      tx: this.state.tx,
      hashAndReceivedSignature,
    };
  }

  verify(crypto: CryptoProvider, signerID: SignerID): boolean {
    if (this.state.type !== "hashed") {
      throw new Error("Cannot verify transaction that is not hashed");
    }

    if (!this.state.hashAndReceivedSignature) {
      throw new Error("Cannot verify transaction that does not have a received signature");
    }

    const verified = crypto.verify(this.state.hashAndReceivedSignature.signature, this.state.hashAndReceivedSignature.hash.digest(), signerID);

    if (verified) {
      this.state = {
        type: "verified",
        tx: this.state.tx,
        hashAndReceivedSignature: this.state.hashAndReceivedSignature,
        validInViewVersionRanges: [],
      };
    } else {
      this.state = {
        type: "verificationFailed",
        tx: this.state.tx,
        hashAndReceivedSignature: this.state.hashAndReceivedSignature,
        error: new Error("Verification failed"),
      };
    }

    return verified;
  }
}

const readKeyCache = new WeakMap<CoValueCore, { [id: KeyID]: KeySecret }>();

type SessionLog = {
  log: TransactionEntry[];
  lastHashed: number | null;
  lastWithSignature: number | null;
  lastVerified: number | null;
}

export class CoValueCore {
  id: RawCoID;
  node: LocalNode;
  crypto: CryptoProvider;
  header: CoValueHeader | null;
  sessionLogs: Map<SessionID, SessionLog>;
  orderedTxs: TransactionEntry[];
  listeners: Set<(content?: RawCoValue) => void> = new Set();

  addTransaction(sessionID: SessionID, after: number, tx: PrivateTransaction | TrustingTransaction, signature?: Signature): Result<boolean, Error> {
    const entry = new TransactionEntry(sessionID, after, tx) as TransactionEntry & {state: UnverifiedTransactionState};

    let session = this.sessionLogs.get(sessionID);
    if (!session) {
      if (after === 0) {
        session = {
          log: [],
          lastHashed: null,
          lastWithSignature: null,
          lastVerified: null,
        };
        this.sessionLogs.set(sessionID, session);
      } else {
        return err(new Error("Cannot add transaction after a non-zero index when we don't have a session log yet"));
      }
    }

    if (after < session.log.length) {
      const currentTxAtIdx = session.log[after];
      if (stableStringify(currentTxAtIdx?.state.tx) === stableStringify(tx)) {
        // If the transaction is already in the log, we don't need to add it again
        return ok(false);
      } else {
        // TODO: show details in the error message
        // TODO: potentially allow new different transactions to "repair" existing transactions that failed to verify?
        return err(new Error("Tried to add a different transaction at the same index"));
      }
    } else if (after > session.log.length) {
      // TODO: show details in the error message
      return err(new Error("Missing transactions in session log"));
    }

    session.log.push(entry);
    if (signature) {
      entry.state.receivedSignature = signature;
      session.lastWithSignature = session.log.length - 1;
    }

    // fast-path: append
    if (this.orderedTxs.length == 0 || isTxEntryEarlier(this.orderedTxs[this.orderedTxs.length - 1]!, entry)) {
      this.orderedTxs.push(entry);
    } else {
      // binary search
      let low = 0;
      let high = this.orderedTxs.length;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (isTxEntryEarlier(this.orderedTxs[mid]!, entry)) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }

      this.orderedTxs.splice(low, 0, entry);
    }

    return ok(true);
  }

  hashTransactions() {
    for (const session of this.sessionLogs.values()) {
      if (session.lastWithSignature === null) {
        continue;
      }

      let currentHash;
      let startIdx = session.lastHashed === null ? 0 : session.lastHashed + 1;

      if (session.lastHashed === null) {
        currentHash = new StreamingHash(this.crypto);
      } else {
        if (session.lastWithSignature === session.lastHashed) {
          continue;
        }

        const lastHashedTx = session.log[session.lastHashed];
        if (!lastHashedTx) {
          throw new Error("Missing transaction in session log");
        }
        if (lastHashedTx.state.type === "unverified" || !lastHashedTx.state.hashAndReceivedSignature) {
          throw new Error("Cannot continue hashing from transaction that is not hashed");
        } else {
          currentHash = lastHashedTx.state.hashAndReceivedSignature.hash.clone();
        }
      }

      for (let i = startIdx; i <= session.lastWithSignature; i++) {
        const entry = session.log[i]!;
        entry.hash(currentHash);
        if (entry.state.type === "hashed" && entry.state.hashAndReceivedSignature) {
          session.lastHashed = i;
        }
      }
    }
  }

  verifyTransactions() {
    for (const [sessionID, session] of this.sessionLogs.entries()) {
      if (session.lastHashed === null) {
        continue;
      }

      const agent = this.node.resolveAccountAgent(accountOrAgentIDfromSessionID(sessionID));

      if (agent.isErr()) {
        console.error("Failed to resolve signer for session", sessionID, agent.error);
        continue;
      }

      // TODO: iterate over all transactions, verify hashed ones

      const lastHashedTx = session.log[session.lastHashed]!;
      if (lastHashedTx.state.type !== "hashed" || !lastHashedTx.state.hashAndReceivedSignature) {
        throw new Error("Cannot verify transaction that is not hashed");
      }

      const hash = lastHashedTx.state.hashAndReceivedSignature.hash;
      const signature = lastHashedTx.state.hashAndReceivedSignature.signature;

      const signerID = this.crypto.getAgentSignerID(agent.value);
      const verified =
    }
  }

  waitForSync(options?: {
    timeout?: number;
  }) {
    return this.node.syncManager.waitForSync(this.id, options?.timeout);
  }
}

function isTxEntryEarlier(tx1: TransactionEntry, tx2: TransactionEntry) {
  if (tx1.state.tx.madeAt < tx2.state.tx.madeAt) {
    return true;
  } else if (tx1.state.tx.madeAt > tx2.state.tx.madeAt) {
    return false;
  } else if (tx1.sessionID < tx2.sessionID) {
    return true;
  } else if (tx1.sessionID > tx2.sessionID) {
    return false;
  } else {
    return tx1.txIdx < tx2.txIdx;
  }
}