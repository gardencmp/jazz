import {
    Account,
    CoID,
    CoValue,
    ControlledAccount,
    InviteSecret,
} from "cojson";
import { AutoSubContext } from "../autoSub.js";
import { ResolvedGroup } from "./resolvedGroup.js";

export class ResolvedAccount<
    A extends Account = Account
> extends ResolvedGroup<A> {
    isMe!: boolean;

    constructor(account: A, autoSubContext: AutoSubContext) {
        super(account, autoSubContext);
        Object.defineProperties(this, {
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
            this.meta.group.core.node.account as ControlledAccount
        ).createGroup();
    }

    acceptInvite<T extends CoValue>(
        groupOrOwnedValueID: CoID<T>,
        inviteSecret: InviteSecret
    ) {
        if (!this.isMe)
            throw new Error("Only the current user can accept an invite");
        return (this.meta.group.core.node.account as ControlledAccount).acceptInvite(
            groupOrOwnedValueID,
            inviteSecret
        );
    }
}
