import { InviteSecret } from "cojson";
import { Account, Group, co } from "../internal.js";
import { CoFeed } from "./coFeed.js";
import { CoMap } from "./coMap.js";
import { CoValue, ID } from "./interfaces.js";

export type WriteOnlyTicket =
  `writeOnly:${ID<InboxRoot<CoValue>>}/${InviteSecret}`;
export type AdminTicket = `admin:${ID<InboxRoot<CoValue>>}/${InviteSecret}`;

// TODO: We want probably to scale to millions of entries, so we need to optimize more the consumption of the feed
// or rotate it when a certain size is reached
export class InboxRoot<M extends CoValue> extends CoMap {
  incoming = co.ref(CoFeed<M>);
  processed = co.ref(CoFeed<M>);
}

type InboxRootWithFeeds<M extends CoValue> = InboxRoot<M> & {
  incoming: CoFeed<M>;
  processed: CoFeed<M>;
};

export class Inbox<M extends CoValue> {
  root: InboxRootWithFeeds<M>;

  private constructor(root: InboxRootWithFeeds<M>) {
    this.root = root;
  }

  async createTickets() {
    const group = this.root._owner;
    const writeOnlyInvite = group._raw.createInvite("writeOnly");
    const adminInvite = group._raw.createInvite("admin");

    return {
      inboxWriteOnlyTicket:
        `writeOnly:${this.root.id}/${writeOnlyInvite}` as const,
      inboxAdminTicket: `admin:${this.root.id}/${adminInvite}` as const,
    };
  }

  subscribe(callback: (id: ID<M>) => Promise<void>) {
    const processedSet = new Set<ID<M>>();
    const processedFeed = this.root.processed._raw;

    // TODO: We don't take into account a possible concurrency between multiple Workers
    for (const session of Object.values(processedFeed.items)) {
      for (const item of session) {
        processedSet.add(item.value as ID<M>);
      }
    }

    return this.root.incoming.subscribe([], (incoming) => {
      for (const session of Object.values(incoming._raw.items)) {
        for (const item of session) {
          const id = item.value as ID<M>;

          if (!processedSet.has(id)) {
            callback(id)
              .then(() => {
                processedSet.add(id);
                // hack: we add a transaction without triggering an update on processedFeed
                processedFeed.core.makeTransaction([id], "private");
              })
              .catch(() => {});
          }
        }
      }
    });
  }

  static create<M extends CoMap>(as: Account) {
    const group = Group.create({
      owner: as,
    });

    const root = InboxRoot.create<InboxRoot<M>>(
      {
        incoming: CoFeed.create<CoFeed<M>>([], {
          owner: group,
        }),
        processed: CoFeed.create<CoFeed<M>>([], {
          owner: group,
        }),
      },
      {
        owner: group,
      },
    );

    return new Inbox(root as InboxRootWithFeeds<M>);
  }

  static parseTicket<M extends CoValue>(ticket: WriteOnlyTicket | AdminTicket) {
    let id: ID<InboxRoot<M>> | null = null;

    if (isWriteOnlyInboxTicket(ticket)) {
      id = ticket.slice("writeOnly:".length, ticket.indexOf("/")) as ID<
        InboxRoot<M>
      >;
    } else if (isAdminInboxTicket(ticket)) {
      id = ticket.slice("admin:".length, ticket.indexOf("/")) as ID<
        InboxRoot<M>
      >;
    }

    const invite = ticket.slice(ticket.indexOf("/") + 1) as InviteSecret;

    if (!id?.startsWith("co_z") || !invite.startsWith("inviteSecret_")) {
      throw new Error("Invalid inbox ticket");
    }

    return {
      id,
      invite,
    };
  }

  static async load<M extends CoValue>(
    ticket: WriteOnlyTicket | AdminTicket,
    account: Account,
  ) {
    const { id, invite } = this.parseTicket<M>(ticket);

    const result = await account.acceptInvite(id, invite, InboxRoot);

    if (!result) {
      throw new Error("Failed to accept invite");
    }

    const root = await InboxRoot.load<
      InboxRoot<M>,
      {
        incoming: [];
        processed: [];
      }
    >(id, account, {
      incoming: [],
      processed: [],
    });

    if (!root) {
      throw new Error("Failed to load the Inbox");
    }

    return new Inbox(root);
  }
}

export function isWriteOnlyInboxTicket(
  ticket: string,
): ticket is WriteOnlyTicket {
  return ticket.startsWith("writeOnly:");
}

export function isAdminInboxTicket(ticket: string): ticket is AdminTicket {
  return ticket.startsWith("admin:");
}
