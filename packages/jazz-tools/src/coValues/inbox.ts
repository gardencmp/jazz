import { CoID, InviteSecret, RawAccount, RawCoMap, SessionID } from "cojson";
import { CoStreamItem, RawCoStream } from "cojson/src/coValues/coStream.js";
import { JsonValue } from "fast-check";
import { Account, Group, isControlledAccount } from "../internal.js";
import { CoValue, ID } from "./interfaces.js";

type InboxInvite = `${CoID<MessagesStream>}/${InviteSecret}`;
type TxKey = `${SessionID}/${number}`;

export type InboxMessage<T extends string, I extends ID<any>> = {
  type: T;
  value: I;
};
type MessagesStream = RawCoStream<InboxMessage<string, any>>;
type TxKeyStream = RawCoStream<TxKey>;
type InboxRoot = RawCoMap<{
  messages: CoID<MessagesStream>;
  processed: CoID<TxKeyStream>;
  failed: CoID<MessagesStream>;
  inviteLink: InboxInvite;
}>;

function createInboxRoot(account: Account) {
  if (!isControlledAccount(account)) {
    throw new Error("Account is not controlled");
  }

  const rawAccount = account._raw;

  const group = rawAccount.createGroup();
  const messagesFeed = group.createStream<MessagesStream>();

  const inboxRoot = rawAccount.createMap<InboxRoot>();
  const processedFeed = rawAccount.createStream<TxKeyStream>();
  const failedFeed = rawAccount.createStream<MessagesStream>();

  const inviteLink =
    `${messagesFeed.id}/${group.createInvite("writeOnly")}` as const;

  inboxRoot.set("messages", messagesFeed.id);
  inboxRoot.set("processed", processedFeed.id);
  inboxRoot.set("failed", failedFeed.id);

  return {
    root: inboxRoot,
    inviteLink,
  };
}

export class Inbox {
  messages: MessagesStream;
  processed: TxKeyStream;
  failed: MessagesStream;
  root: InboxRoot;

  private constructor(
    root: InboxRoot,
    messages: MessagesStream,
    processed: TxKeyStream,
    failed: MessagesStream,
  ) {
    this.root = root;
    this.messages = messages;
    this.processed = processed;
    this.failed = failed;
  }

  subscribe<M extends InboxMessage<string, any>>(
    callback: (message: M) => Promise<void>,
  ) {
    // TODO: Register the subscription to get a % of the new messages
    const processed = new Set<`${SessionID}/${number}`>();
    const processing = new Set<`${SessionID}/${number}`>();
    const failed = new Map<`${SessionID}/${number}`, number>();

    // TODO: We don't take into account a possible concurrency between multiple Workers
    for (const items of Object.values(this.processed.items)) {
      for (const item of items) {
        processed.add(item.value as TxKey);
      }
    }

    return this.messages.core.subscribe((value) => {
      const messages = value as MessagesStream;
      for (const [sessionID, items] of Object.entries(messages.items) as [
        SessionID,
        CoStreamItem<M>[],
      ][]) {
        for (const item of items) {
          const txKey = `${sessionID}/${item.tx.txIndex}` as const;

          if (!processed.has(txKey) && !processing.has(txKey)) {
            const failures = failed.get(txKey);

            if (failures && failures > 3) {
              processed.add(txKey);
              this.processed.push(txKey);
              this.failed.push(item.value);
              continue;
            }

            processing.add(txKey);

            callback(item.value)
              .then(() => {
                // hack: we add a transaction without triggering an update on processedFeed
                this.processed.push(txKey);
                processing.delete(txKey);
                processed.add(txKey);
              })
              .catch((error) => {
                console.error("Error processing inbox message", error);
                processing.delete(txKey);
              });
          }
        }
      }
    });
  }

  static createIfMissing(account: Account) {
    const profile = account.profile;

    if (!profile) {
      throw new Error("Account profile should already be loaded");
    }

    if (profile.inbox) {
      return;
    }

    const { root, inviteLink } = createInboxRoot(account);

    profile.inbox = root.id;
    profile.inboxInvite = inviteLink;
  }

  static async load(account: Account) {
    const profile = account.profile;

    if (!profile) {
      throw new Error("Account profile should already be loaded");
    }

    if (!profile.inbox) {
      this.createIfMissing(account);
    }

    const node = account._raw.core.node;

    const root = await node.load(profile.inbox as CoID<InboxRoot>);

    if (root === "unavailable") {
      throw new Error("Inbox not found");
    }

    const [messages, processed, failed] = await Promise.all([
      node.load(root.get("messages")!),
      node.load(root.get("processed")!),
      node.load(root.get("failed")!),
    ]);

    if (
      messages === "unavailable" ||
      processed === "unavailable" ||
      failed === "unavailable"
    ) {
      throw new Error("Inbox not found");
    }

    return new Inbox(root, messages, processed, failed);
  }
}

export class InboxConsumer<M extends InboxMessage<string, any>> {
  currentAccount: Account;
  owner: Account;
  messages: MessagesStream;

  private constructor(
    currentAccount: Account,
    owner: Account,
    messages: MessagesStream,
  ) {
    this.currentAccount = currentAccount;
    this.owner = owner;
    this.messages = messages;
  }

  getOwnerAccount() {
    return this.owner;
  }

  sendMessage(message: M) {
    const node = this.currentAccount._raw.core.node;

    const value = node.expectCoValueLoaded(message.value);
    const content = value.getCurrentContent();

    const group = content.group;

    if (group instanceof RawAccount) {
      throw new Error("Inbox messages should be owned by a group");
    }

    if (!group.roleOf(this.owner._raw.id)) {
      group.addMember(this.owner._raw, "writer");
    }

    this.messages.push(message);
  }

  static async load(fromAccountID: ID<Account>, currentAccount: Account) {
    const fromAccount = await Account.load(fromAccountID, currentAccount, {
      profile: {},
    });

    if (!fromAccount?.profile?.inboxInvite) {
      throw new Error("Inbox invite not found");
    }

    const invite = fromAccount.profile.inboxInvite;
    const id = await acceptInvite(invite, currentAccount);
    const node = currentAccount._raw.core.node;

    const messages = await node.load(id);

    if (messages === "unavailable") {
      throw new Error("Inbox not found");
    }

    return new InboxConsumer(currentAccount, fromAccount, messages);
  }
}

async function acceptInvite(invite: string, account: Account) {
  const id = invite.slice(0, invite.indexOf("/")) as CoID<MessagesStream>;

  const inviteSecret = invite.slice(invite.indexOf("/") + 1) as InviteSecret;

  if (!id?.startsWith("co_z") || !inviteSecret.startsWith("inviteSecret_")) {
    throw new Error("Invalid inbox ticket");
  }

  if (!isControlledAccount(account)) {
    throw new Error("Account is not controlled");
  }

  await account._raw.acceptInvite(id, inviteSecret);

  return id;
}
