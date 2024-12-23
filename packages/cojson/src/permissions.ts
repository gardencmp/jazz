import { CoID } from "./coValue.js";
import { CoValueCore, Transaction } from "./coValueCore.js";
import { RawAccount, RawAccountID, RawProfile } from "./coValues/account.js";
import { MapOpPayload } from "./coValues/coMap.js";
import { EVERYONE, Everyone, RawGroup } from "./coValues/group.js";
import { KeyID } from "./crypto/crypto.js";
import {
  AgentID,
  ParentGroupReference,
  RawCoID,
  SessionID,
  TransactionID,
  getParentGroupId,
} from "./ids.js";
import { parseJSON } from "./jsonStringify.js";
import { JsonValue } from "./jsonValue.js";
import { accountOrAgentIDfromSessionID } from "./typeUtils/accountOrAgentIDfromSessionID.js";
import { expectGroup } from "./typeUtils/expectGroup.js";

export type PermissionsDef =
  | { type: "group"; initialAdmin: RawAccountID | AgentID }
  | { type: "ownedByGroup"; group: RawCoID }
  | { type: "unsafeAllowAll" };

export type AccountRole = "reader" | "writer" | "admin" | "writeOnly";

export type Role =
  | AccountRole
  | "revoked"
  | "adminInvite"
  | "writerInvite"
  | "readerInvite"
  | "writeOnlyInvite";

type ValidTransactionsResult = { txID: TransactionID; tx: Transaction };
type MemberState = { [agent: RawAccountID | AgentID]: Role; [EVERYONE]?: Role };

let logPermissionErrors = true;

export function disablePermissionErrors() {
  logPermissionErrors = false;
}

function logPermissionError(...args: unknown[]) {
  if (logPermissionErrors === false) {
    return;
  }

  console.warn(...args);
}

export function determineValidTransactions(
  coValue: CoValueCore,
): { txID: TransactionID; tx: Transaction }[] {
  if (coValue.header.ruleset.type === "group") {
    const initialAdmin = coValue.header.ruleset.initialAdmin;
    if (!initialAdmin) {
      throw new Error("Group must have initialAdmin");
    }

    return determineValidTransactionsForGroup(coValue, initialAdmin)
      .validTransactions;
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

    const validTransactions: ValidTransactionsResult[] = [];

    for (const [sessionID, sessionLog] of coValue.sessionLogs.entries()) {
      const transactor = accountOrAgentIDfromSessionID(sessionID);

      sessionLog.transactions.forEach((tx, txIndex) => {
        const groupAtTime = groupContent.atTime(tx.madeAt);
        const effectiveTransactor = agentInAccountOrMemberInGroup(
          transactor,
          groupAtTime,
        );

        if (!effectiveTransactor) {
          return;
        }

        const transactorRoleAtTxTime =
          groupAtTime.roleOfInternal(effectiveTransactor)?.role ||
          groupAtTime.roleOfInternal(EVERYONE)?.role;

        if (
          transactorRoleAtTxTime !== "admin" &&
          transactorRoleAtTxTime !== "writer" &&
          transactorRoleAtTxTime !== "writeOnly"
        ) {
          return;
        }

        validTransactions.push({ txID: { sessionID, txIndex }, tx });
      });
    }

    return validTransactions;
  } else if (coValue.header.ruleset.type === "unsafeAllowAll") {
    const validTransactions: ValidTransactionsResult[] = [];

    for (const [sessionID, sessionLog] of coValue.sessionLogs.entries()) {
      sessionLog.transactions.forEach((tx, txIndex) => {
        validTransactions.push({ txID: { sessionID, txIndex }, tx });
      });
    }
    return validTransactions;
  } else {
    throw new Error(
      "Unknown ruleset type " +
        (coValue.header.ruleset as { type: string }).type,
    );
  }
}

function isHigherRole(a: Role, b: Role | undefined) {
  if (a === undefined) return false;
  if (b === undefined) return true;
  if (b === "admin") return false;
  if (a === "admin") return true;

  return a === "writer" && b === "reader";
}

function resolveMemberStateFromParentReference(
  coValue: CoValueCore,
  memberState: MemberState,
  parentReference: ParentGroupReference,
) {
  const parentGroup = coValue.node.expectCoValueLoaded(
    getParentGroupId(parentReference),
    "Expected parent group to be loaded",
  );

  if (parentGroup.header.ruleset.type !== "group") {
    return;
  }

  const initialAdmin = parentGroup.header.ruleset.initialAdmin;

  if (!initialAdmin) {
    throw new Error("Group must have initialAdmin");
  }

  const { memberState: parentGroupMemberState } =
    determineValidTransactionsForGroup(parentGroup, initialAdmin);

  for (const agent of Object.keys(parentGroupMemberState) as Array<
    keyof MemberState
  >) {
    const parentRole = parentGroupMemberState[agent];
    const currentRole = memberState[agent];

    if (parentRole && isHigherRole(parentRole, currentRole)) {
      memberState[agent] = parentRole;
    }
  }
}

function determineValidTransactionsForGroup(
  coValue: CoValueCore,
  initialAdmin: RawAccountID | AgentID,
): { validTransactions: ValidTransactionsResult[]; memberState: MemberState } {
  const allTransactionsSorted = [...coValue.sessionLogs.entries()].flatMap(
    ([sessionID, sessionLog]) => {
      return sessionLog.transactions.map((tx, txIndex) => ({
        sessionID,
        txIndex,
        tx,
      })) as {
        sessionID: SessionID;
        txIndex: number;
        tx: Transaction;
      }[];
    },
  );

  allTransactionsSorted.sort((a, b) => {
    return a.tx.madeAt - b.tx.madeAt;
  });

  const memberState: MemberState = {};
  const validTransactions: ValidTransactionsResult[] = [];

  const keyRevelations = new Set<string>();
  const writeKeys = new Set<string>();

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
        logPermissionError(
          "Only admins can make private transactions in groups",
        );
        continue;
      }
    }

    let changes;

    try {
      changes = parseJSON(tx.changes);
    } catch (e) {
      logPermissionError(
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
      | MapOpPayload<RawAccountID | AgentID | Everyone, Role>
      | MapOpPayload<"readKey", JsonValue>
      | MapOpPayload<"profile", CoID<RawProfile>>
      | MapOpPayload<`parent_${CoID<RawGroup>}`, CoID<RawGroup>>
      | MapOpPayload<`child_${CoID<RawGroup>}`, CoID<RawGroup>>;

    if (changes.length !== 1) {
      logPermissionError("Group transaction must have exactly one change");
      continue;
    }

    if (change.op !== "set") {
      logPermissionError("Group transaction must set a role or readKey");
      continue;
    }

    if (change.key === "readKey") {
      if (memberState[transactor] !== "admin") {
        logPermissionError("Only admins can set readKeys");
        continue;
      }

      validTransactions.push({ txID: { sessionID, txIndex }, tx });
      continue;
    } else if (change.key === "profile") {
      if (memberState[transactor] !== "admin") {
        logPermissionError("Only admins can set profile");
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
        memberState[transactor] !== "readerInvite" &&
        memberState[transactor] !== "writeOnlyInvite"
      ) {
        logPermissionError("Only admins can reveal keys");
        continue;
      }

      /**
       * We don't want to give the ability to invite members to override
       * key revelations, otherwise they could hide a key revelation to any user
       * blocking them from accessing the group.
       */
      if (
        keyRevelations.has(change.key) &&
        memberState[transactor] !== "admin"
      ) {
        logPermissionError(
          "Key revelation already exists and can't be overridden by invite",
        );
        continue;
      }

      keyRevelations.add(change.key);

      // TODO: check validity of agents who the key is revealed to?
      validTransactions.push({ txID: { sessionID, txIndex }, tx });
      continue;
    } else if (isParentExtension(change.key)) {
      if (memberState[transactor] !== "admin") {
        logPermissionError("Only admins can set parent extensions");
        continue;
      }
      resolveMemberStateFromParentReference(coValue, memberState, change.key);
      validTransactions.push({ txID: { sessionID, txIndex }, tx });
      continue;
    } else if (isChildExtension(change.key)) {
      if (memberState[transactor] !== "admin") {
        logPermissionError("Only admins can set child extensions");
        continue;
      }
      validTransactions.push({ txID: { sessionID, txIndex }, tx });
      continue;
    } else if (isWriteKeyForMember(change.key)) {
      if (
        memberState[transactor] !== "admin" &&
        memberState[transactor] !== "writeOnlyInvite"
      ) {
        logPermissionError("Only admins can set writeKeys");
        continue;
      }

      /**
       * writeOnlyInvite need to be able to set writeKeys because every new writeOnly
       * member comes with their own write key.
       *
       * We don't want to give the ability to invite members to override
       * write keys, otherwise they could hide a write key to other writeOnly users
       * blocking them from accessing the group.ß
       */
      if (writeKeys.has(change.key) && memberState[transactor] !== "admin") {
        logPermissionError(
          "Write key already exists and can't be overridden by invite",
        );
        continue;
      }

      writeKeys.add(change.key);

      validTransactions.push({ txID: { sessionID, txIndex }, tx });
      continue;
    }

    const affectedMember = change.key;
    const assignedRole = change.value;

    if (
      change.value !== "admin" &&
      change.value !== "writer" &&
      change.value !== "reader" &&
      change.value !== "writeOnly" &&
      change.value !== "revoked" &&
      change.value !== "adminInvite" &&
      change.value !== "writerInvite" &&
      change.value !== "readerInvite" &&
      change.value !== "writeOnlyInvite"
    ) {
      logPermissionError("Group transaction must set a valid role");
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
      logPermissionError(
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
          logPermissionError("Admins can only demote themselves.");
          continue;
        }
      } else if (memberState[transactor] === "adminInvite") {
        if (change.value !== "admin") {
          logPermissionError("AdminInvites can only create admins.");
          continue;
        }
      } else if (memberState[transactor] === "writerInvite") {
        if (change.value !== "writer") {
          logPermissionError("WriterInvites can only create writers.");
          continue;
        }
      } else if (memberState[transactor] === "readerInvite") {
        if (change.value !== "reader") {
          logPermissionError("ReaderInvites can only create reader.");
          continue;
        }
      } else if (memberState[transactor] === "writeOnlyInvite") {
        if (change.value !== "writeOnly") {
          logPermissionError("WriteOnlyInvites can only create writeOnly.");
          continue;
        }
      } else {
        logPermissionError(
          "Group transaction must be made by current admin or invite",
        );
        continue;
      }
    }

    memberState[affectedMember] = change.value;
    validTransactions.push({ txID: { sessionID, txIndex }, tx });

    // console.log("after", { memberState, validTransactions });
  }

  return { validTransactions, memberState };
}

function agentInAccountOrMemberInGroup(
  transactor: RawAccountID | AgentID,
  groupAtTime: RawGroup,
): RawAccountID | AgentID | undefined {
  if (transactor === groupAtTime.id && groupAtTime instanceof RawAccount) {
    return groupAtTime.currentAgentID().match(
      (agentID) => agentID,
      (e) => {
        console.error(
          "Error while determining current agent ID in valid transactions",
          e,
        );
        return undefined;
      },
    );
  }
  return transactor;
}

export function isWriteKeyForMember(
  co: string,
): co is `writeKeyFor_${RawAccountID | AgentID}` {
  return co.startsWith("writeKeyFor_");
}

export function isKeyForKeyField(co: string): co is `${KeyID}_for_${KeyID}` {
  return co.startsWith("key_") && co.includes("_for_key");
}

export function isKeyForAccountField(
  co: string,
): co is `${KeyID}_for_${RawAccountID | AgentID}` {
  return (
    (co.startsWith("key_") &&
      (co.includes("_for_sealer") || co.includes("_for_co"))) ||
    co.includes("_for_everyone")
  );
}

function isParentExtension(key: string): key is `parent_${CoID<RawGroup>}` {
  return key.startsWith("parent_");
}

function isChildExtension(key: string): key is `child_${CoID<RawGroup>}` {
  return key.startsWith("child_");
}
