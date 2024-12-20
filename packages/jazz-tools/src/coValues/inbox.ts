import {
  CoID,
  InviteSecret,
  RawAccount,
  RawCoMap,
  RawControlledAccount,
  SessionID,
} from "cojson";
import { CoStreamItem, RawCoStream } from "cojson";
import { type Account } from "./account.js";
import { CoValue, CoValueClass, ID, loadCoValue } from "./interfaces.js";

export type InboxInvite = `${CoID<MessagesStream>}/${InviteSecret}`;
type TxKey = `${SessionID}/${number}`;

type MessagesStream = RawCoStream<CoID<InboxMessage<CoValue, any>>>;
type FailedMessagesStream = RawCoStream<{
  errors: string[];
  value: CoID<InboxMessage<CoValue, any>>;
}>;
type TxKeyStream = RawCoStream<TxKey>;
export type InboxRoot = RawCoMap<{
  messages: CoID<MessagesStream>;
  processed: CoID<TxKeyStream>;
  failed: CoID<FailedMessagesStream>;
  inviteLink: InboxInvite;
}>;

export function createInboxRoot(account: Account) {
  if (!account.isMe) {
    throw new Error("Account is not controlled");
  }

  const rawAccount = account._raw as RawControlledAccount;

  const group = rawAccount.createGroup();
  const messagesFeed = group.createStream<MessagesStream>();

  const inboxRoot = rawAccount.createMap<InboxRoot>();
  const processedFeed = rawAccount.createStream<TxKeyStream>();
  const failedFeed = rawAccount.createStream<FailedMessagesStream>();

  const inviteLink =
    `${messagesFeed.id}/${group.createInvite("writeOnly")}` as const;

  inboxRoot.set("messages", messagesFeed.id);
  inboxRoot.set("processed", processedFeed.id);
  inboxRoot.set("failed", failedFeed.id);

  return {
    id: inboxRoot.id,
    inviteLink,
  };
}

type InboxMessage<I extends CoValue, O extends CoValue | undefined> = RawCoMap<{
  payload: ID<I>;
  result: ID<O> | undefined;
  processed: boolean;
  error: string | undefined;
}>;

function createInboxMessage<I extends CoValue, O extends CoValue | undefined>(
  payload: I,
  inboxOwner: RawAccount,
) {
  const group = payload._raw.group;

  if (group instanceof RawAccount) {
    throw new Error("Inbox messages should be owned by a group");
  }

  group.addMember(inboxOwner, "writer");

  const message = group.createMap<InboxMessage<I, O>>({
    payload: payload.id,
    result: undefined,
    processed: false,
    error: undefined,
  });

  return message;
}

export class Inbox {
  account: Account;
  messages: MessagesStream;
  processed: TxKeyStream;
  failed: FailedMessagesStream;
  root: InboxRoot;
  processing = new Set<`${SessionID}/${number}`>();

  private constructor(
    account: Account,
    root: InboxRoot,
    messages: MessagesStream,
    processed: TxKeyStream,
    failed: FailedMessagesStream,
  ) {
    this.account = account;
    this.root = root;
    this.messages = messages;
    this.processed = processed;
    this.failed = failed;
  }

  subscribe<I extends CoValue, O extends CoValue | undefined>(
    Schema: CoValueClass<I>,
    callback: (
      message: I,
      senderAccountID: ID<Account>,
    ) => Promise<O | undefined | void>,
    options: { retries?: number } = {},
  ) {
    const processed = new Set<`${SessionID}/${number}`>();
    const failed = new Map<`${SessionID}/${number}`, string[]>();
    const node = this.account._raw.core.node;

    this.processed.subscribe((stream) => {
      for (const items of Object.values(stream.items)) {
        for (const item of items) {
          processed.add(item.value as TxKey);
        }
      }
    });

    const { account } = this;
    const { retries = 3 } = options;

    let failTimer: ReturnType<typeof setTimeout> | number | undefined =
      undefined;

    const clearFailTimer = () => {
      clearTimeout(failTimer);
      failTimer = undefined;
    };

    const handleNewMessages = (stream: MessagesStream) => {
      clearFailTimer(); // Stop the failure timers, we're going to process the failed entries anyway

      for (const [sessionID, items] of Object.entries(stream.items) as [
        SessionID,
        CoStreamItem<CoID<InboxMessage<I, O>>>[],
      ][]) {
        const accountID = getAccountIDfromSessionID(sessionID);

        if (!accountID) {
          console.warn("Received message from unknown account", sessionID);
          continue;
        }

        for (const item of items) {
          const txKey = `${sessionID}/${item.tx.txIndex}` as const;

          if (!processed.has(txKey) && !this.processing.has(txKey)) {
            this.processing.add(txKey);

            const id = item.value;

            node
              .load(id)
              .then((message) => {
                if (message === "unavailable") {
                  return Promise.reject(
                    new Error("Unable to load inbox message " + id),
                  );
                }

                return loadCoValue(
                  Schema,
                  message.get("payload") as ID<I>,
                  account,
                  [],
                );
              })
              .then((value) => {
                if (!value) {
                  return Promise.reject(
                    new Error("Unable to load inbox message " + id),
                  );
                }

                return callback(value, accountID);
              })
              .then((result) => {
                const inboxMessage = node
                  .expectCoValueLoaded(item.value)
                  .getCurrentContent() as RawCoMap;

                if (result) {
                  inboxMessage.set("result", result.id);
                }

                inboxMessage.set("processed", true);

                this.processed.push(txKey);
                this.processing.delete(txKey);
              })
              .catch((error) => {
                console.error("Error processing inbox message", error);
                this.processing.delete(txKey);
                const errors = failed.get(txKey) ?? [];

                const stringifiedError = String(error);
                errors.push(stringifiedError);

                const inboxMessage = node
                  .expectCoValueLoaded(item.value)
                  .getCurrentContent() as RawCoMap;

                inboxMessage.set("error", stringifiedError);

                if (errors.length > retries) {
                  inboxMessage.set("processed", true);
                  this.processed.push(txKey);
                  this.failed.push({ errors, value: item.value });
                } else {
                  failed.set(txKey, errors);
                  if (!failTimer) {
                    failTimer = setTimeout(
                      () => handleNewMessages(stream),
                      100,
                    );
                  }
                }
              });
          }
        }
      }
    };

    return this.messages.subscribe(handleNewMessages);
  }

  static async load(account: Account) {
    const profile = account.profile;

    if (!profile) {
      throw new Error("Account profile should already be loaded");
    }

    if (!profile.inbox) {
      throw new Error("The account has not set up their inbox");
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

    return new Inbox(account, root, messages, processed, failed);
  }
}

export class InboxSender<I extends CoValue, O extends CoValue | undefined> {
  currentAccount: Account;
  owner: RawAccount;
  messages: MessagesStream;

  private constructor(
    currentAccount: Account,
    owner: RawAccount,
    messages: MessagesStream,
  ) {
    this.currentAccount = currentAccount;
    this.owner = owner;
    this.messages = messages;
  }

  getOwnerAccount() {
    return this.owner;
  }

  sendMessage(message: I): Promise<O extends CoValue ? ID<O> : undefined> {
    const inboxMessage = createInboxMessage<I, O>(message, this.owner);

    this.messages.push(inboxMessage.id);

    return new Promise((resolve, reject) => {
      inboxMessage.subscribe((message) => {
        if (message.get("processed")) {
          const error = message.get("error");
          if (error) {
            reject(new Error(error));
          } else {
            resolve(
              message.get("result") as O extends CoValue ? ID<O> : undefined,
            );
          }
        }
      });
    });
  }

  static async load<
    I extends CoValue,
    O extends CoValue | undefined = undefined,
  >(inboxOwnerID: ID<Account>, currentAccount: Account) {
    const node = currentAccount._raw.core.node;

    const inboxOwnerRaw = await node.load(
      inboxOwnerID as unknown as CoID<RawAccount>,
    );

    if (inboxOwnerRaw === "unavailable") {
      throw new Error("Failed to load the inbox owner");
    }

    const inboxOwnerProfileRaw = await node.load(inboxOwnerRaw.get("profile")!);

    if (inboxOwnerProfileRaw === "unavailable") {
      throw new Error("Failed to load the inbox owner profile");
    }

    const inboxInvite = inboxOwnerProfileRaw.get("inboxInvite");

    if (!inboxInvite) {
      throw new Error("The user has not set up their inbox");
    }

    const id = await acceptInvite(inboxInvite as InboxInvite, currentAccount);

    const messages = await node.load(id);

    if (messages === "unavailable") {
      throw new Error("Inbox not found");
    }

    return new InboxSender<I, O>(currentAccount, inboxOwnerRaw, messages);
  }
}

async function acceptInvite(invite: string, account: Account) {
  const id = invite.slice(0, invite.indexOf("/")) as CoID<MessagesStream>;

  const inviteSecret = invite.slice(invite.indexOf("/") + 1) as InviteSecret;

  if (!id?.startsWith("co_z") || !inviteSecret.startsWith("inviteSecret_")) {
    throw new Error("Invalid inbox ticket");
  }

  if (!account.isMe) {
    throw new Error("Account is not controlled");
  }

  await (account._raw as RawControlledAccount).acceptInvite(id, inviteSecret);

  return id;
}

function getAccountIDfromSessionID(sessionID: SessionID) {
  const until = sessionID.indexOf("_session");
  const accountID = sessionID.slice(0, until);

  if (accountID.startsWith("co_z")) {
    return accountID as ID<Account>;
  }

  return;
}
