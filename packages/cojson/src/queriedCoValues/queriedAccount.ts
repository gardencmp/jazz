import { Account } from "../coValues/account.js";
import { CoID, CoValue, ControlledAccount, InviteSecret } from "../index.js";
import { QueryContext } from "../queries.js";
import { QueriedGroup } from "./queriedGroup.js";

export class QueriedAccount<A extends Account = Account> extends QueriedGroup<A> {
    id!: CoID<A>;
    isMe!: boolean;

    constructor(account: A, queryContext: QueryContext) {
        super(account, queryContext);
        Object.defineProperties(this, {
            id: { value: account.id, enumerable: false },
            isMe: {
                value: account.core.node.account.id === account.id,
                enumerable: false,
            },
        });
    }

    createGroup() {
        if (!this.isMe)
            throw new Error("Only the current user can create a group");
        return (
            this.group.core.node.account as ControlledAccount
        ).createGroup();
    }

    acceptInvite<T extends CoValue>(
        groupOrOwnedValueID: CoID<T>,
        inviteSecret: InviteSecret
    ) {
        if (!this.isMe)
            throw new Error("Only the current user can accept an invite");
        return (this.group.core.node.account as ControlledAccount).acceptInvite(
            groupOrOwnedValueID,
            inviteSecret
        );
    }
}
