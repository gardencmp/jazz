import {
    RawCoList as RawCoList,
    RawAccount as RawAccount,
    CoValueCore,
    RawControlledAccount as RawControlledAccount
} from "cojson";
import { CoValueMetaBase } from "../../baseInterfaces.js";
import { Schema } from "../../schema.js";
import { SimpleGroup } from "../group/simpleGroup.js";
import { Account } from "../account/account.js";
import { ValueRef } from "../../valueRef.js";
import { Group } from "../group/group.js";
import { SimpleAccount } from "../account/simpleAccount.js";
import { ControlledAccount } from "../account/account.js";


export class CoListMeta<Item extends Schema> implements CoValueMetaBase {
    owner: Account | Group;
    _raw: RawCoList;
    core: CoValueCore;
    loadedAs: ControlledAccount;
    refs: ValueRef<Item["_Value"]>[];
    constructor(raw: RawCoList, refs: ValueRef<Item["_Value"]>[]) {
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = SimpleGroup.fromRaw(rawOwner);
        }
        this._raw = raw;
        this.core = raw.core;
        this.loadedAs = SimpleAccount.ControlledSchema.fromRaw(
            this._raw.core.node.account as RawControlledAccount
        );
        this.refs = refs;
    }
}
