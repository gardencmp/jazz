import { InviteSecret, SessionID } from "cojson";
import { CoStreamItem } from "cojson/src/coValues/coStream.js";
import { JsonValue } from "fast-check";
import { type Account, Group, co, resolveAccount } from "../internal.js";
import { CoFeed } from "./coFeed.js";
import { CoMap } from "./coMap.js";
import { CoValue, ID } from "./interfaces.js";

export type InboxInvite = `writeOnly:${ID<InboxRoot>}/${InviteSecret}`;

export type TxKey = `${SessionID}/${number}`;

// TODO: We want probably to scale to millions of entries, so we need to optimize more the consumption of the feed
// or rotate it when a certain size is reached
export class InboxRoot extends CoMap {
  incoming = co.ref(CoFeed.Of(co.string));
  processed = co.ref(CoFeed.Of(co.string));
  failed = co.ref(CoFeed.Of(co.string));
}

type InboxRootWithFeeds = InboxRoot & {
  incoming: CoFeed<string>;
  processed: CoFeed<string>;
  failed: CoFeed<string>;
};

export class Inbox {
  root: InboxRootWithFeeds;

  private constructor(root: InboxRootWithFeeds) {
    this.root = root;
  }

  createInvite() {
    const group = this.root.incoming._owner;
    const writeOnlyInvite = group._raw.createInvite("writeOnly");

    return `writeOnly:${this.root.incoming.id}/${writeOnlyInvite}` as const;
  }

  static async acceptInvite(invite: string, account: Account) {
    const id = invite.slice("writeOnly:".length, invite.indexOf("/")) as ID<
      CoFeed<string>
    >;

    const inviteSecret = invite.slice(invite.indexOf("/") + 1) as InviteSecret;

    if (!id?.startsWith("co_z") || !inviteSecret.startsWith("inviteSecret_")) {
      throw new Error("Invalid inbox ticket");
    }

    const result = await account.acceptInvite(
      id,
      inviteSecret,
      CoFeed.Of(co.string),
    );

    if (!result) {
      throw new Error("Failed to accept invite");
    }

    return result;
  }

  getOwnerAccount() {
    return resolveAccount(this.root._owner);
  }

  subscribe<V extends CoValue>(callback: (id: ID<V>) => Promise<void>) {
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

            callback(item.value as ID<V>)
              .then(() => {
                // hack: we add a transaction without triggering an update on processedFeed
                processedFeed.push(txKey);
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

  static create(as: Account) {
    const group = Group.create({
      owner: as,
    });

    const root = InboxRoot.create(
      {
        incoming: CoFeed.Of(co.string).create([], {
          owner: group,
        }),
        processed: CoFeed.Of(co.string).create([], {
          owner: as,
        }),
        failed: CoFeed.Of(co.string).create([], {
          owner: as,
        }),
      },
      {
        owner: as,
      },
    );

    return new Inbox(root as InboxRootWithFeeds);
  }

  static async load(id: ID<InboxRoot>, account: Account) {
    const root = await InboxRoot.load<
      InboxRoot,
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
