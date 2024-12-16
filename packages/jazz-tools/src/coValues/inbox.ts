import { InviteSecret, SessionID } from "cojson";
import { CoStreamItem } from "cojson/src/coValues/coStream.js";
import { JsonValue } from "fast-check";
import { type Account, Group, co, resolveAccount } from "../internal.js";
import { CoFeed } from "./coFeed.js";
import { CoMap } from "./coMap.js";
import { CoValue, ID } from "./interfaces.js";

export type InboxInvite<M extends CoValue> =
  `writeOnly:${ID<InboxRoot<M>>}/${InviteSecret}`;

export type TxKey = `${SessionID}/${number}`;

// TODO: We want probably to scale to millions of entries, so we need to optimize more the consumption of the feed
// or rotate it when a certain size is reached
export class InboxRoot<M extends CoValue> extends CoMap {
  incoming = co.ref(CoFeed<M>);
  processed = co.ref(CoFeed<TxKey>);
  failed = co.ref(CoFeed<M>);
}

type InboxRootWithFeeds<M extends CoValue> = InboxRoot<M> & {
  incoming: CoFeed<M>;
  processed: CoFeed<TxKey>;
  failed: CoFeed<M>;
};

export class Inbox<M extends CoValue> {
  root: InboxRootWithFeeds<M>;

  private constructor(root: InboxRootWithFeeds<M>) {
    this.root = root;
  }

  async createInvite(): Promise<InboxInvite<M>> {
    const group = this.root._owner;
    const writeOnlyInvite = group._raw.createInvite("writeOnly");

    return `writeOnly:${this.root.id}/${writeOnlyInvite}` as const;
  }

  static async acceptInvite<M extends CoValue>(
    account: Account,
    invite: InboxInvite<M>,
  ) {
    const id = invite.slice("writeOnly:".length, invite.indexOf("/")) as ID<
      InboxRoot<M>
    >;

    const inviteSecret = invite.slice(invite.indexOf("/") + 1) as InviteSecret;

    if (!id?.startsWith("co_z") || !inviteSecret.startsWith("inviteSecret_")) {
      throw new Error("Invalid inbox ticket");
    }

    const result = await account.acceptInvite(id, inviteSecret, InboxRoot);

    if (!result) {
      throw new Error("Failed to accept invite");
    }

    return result.id;
  }

  getOwnerAccount() {
    return resolveAccount(this.root._owner);
  }

  subscribe(callback: (id: ID<M>) => Promise<void>) {
    // TODO: Register the subscription to get a % of the new messages

    const processed = new Set<`${SessionID}/${number}`>();
    const processing = new Set<`${SessionID}/${number}`>();
    const failed = new Map<`${SessionID}/${number}`, number>();
    const processedFeed = this.root.processed._raw;
    const failedFeed = this.root.failed._raw;

    // TODO: We don't take into account a possible concurrency between multiple Workers
    for (const items of Object.values(processedFeed.items)) {
      for (const item of items) {
        processed.add(item.value as TxKey);
      }
    }

    return this.root.incoming.subscribe([], (incoming) => {
      for (const [sessionID, items] of Object.entries(incoming._raw.items) as [
        SessionID,
        CoStreamItem<JsonValue>[],
      ][]) {
        for (const item of items) {
          const txKey = `${sessionID}/${item.tx.txIndex}` as const;

          if (!processed.has(txKey) && !processing.has(txKey)) {
            const failures = failed.get(txKey);

            if (failures && failures > 3) {
              processed.add(txKey);
              processedFeed.push(txKey);
              failedFeed.push(item.value);
              continue;
            }

            processing.add(txKey);

            callback(item.value as ID<M>)
              .then(() => {
                // hack: we add a transaction without triggering an update on processedFeed
                processedFeed.push(txKey);
                processing.delete(txKey);
                processed.add(txKey);
              })
              .catch(() => {
                processing.delete(txKey);
              });
          }
        }
      }
    });
  }

  static create<M extends CoValue>(as: Account) {
    const group = Group.create({
      owner: as,
    });

    const root = InboxRoot.create<InboxRoot<M>>(
      {
        incoming: CoFeed.create<CoFeed<M>>([], {
          owner: group,
        }),
        processed: CoFeed.create<CoFeed<TxKey>>([], {
          owner: group,
        }),
        failed: CoFeed.create<CoFeed<M>>([], {
          owner: group,
        }),
      },
      {
        owner: group,
      },
    );

    return new Inbox(root as InboxRootWithFeeds<M>);
  }

  static async load<M extends CoValue>(
    id: ID<InboxRoot<any>>,
    account: Account,
  ) {
    const root = await InboxRoot.load<
      InboxRoot<M>,
      {
        incoming: [];
        processed: [];
        failed: [];
      }
    >(id, account, {
      incoming: [],
      processed: [],
      failed: [],
    });

    if (!root) {
      throw new Error("Failed to load the Inbox");
    }

    return new Inbox(root);
  }
}
