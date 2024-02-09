import {
    RawCoStream as RawCoStream,
    RawAccount as RawAccount,
    CoValueCore, RawControlledAccount
} from "cojson";
import { Account, ControlledAccount } from "../account/account.js";
import { CoValueMetaBase } from "../../baseInterfaces.js";
import { Group } from "../group/group.js";
import { SimpleAccount } from "../account/simpleAccount.js";
import { SimpleGroup } from "../group/simpleGroup.js";


export class CoStreamMeta implements CoValueMetaBase {
    owner: Account | Group;
    core: CoValueCore;
    loadedAs: ControlledAccount;

    constructor(raw: RawCoStream) {
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = SimpleGroup.fromRaw(rawOwner);
        }
        this.core = raw.core;
        this.loadedAs = SimpleAccount.ControlledSchema.fromRaw(
            raw.core.node.account as RawControlledAccount
        );
    }
}
