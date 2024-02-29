import { RawCoMap, RawAccount, RawControlledAccount } from "cojson";
import { SimpleAccount } from "../../index.js";
import { CoValueMetaBase } from "../../baseInterfaces.js";
import { Group } from "../group/group.js";
import { Account, ControlledAccount } from "../account/account.js";
import { SimpleGroup } from "../group/simpleGroup.js";
import { RawShape } from "./rawShape.js";
import { BaseCoMapShape } from "./coMap.js";
import { RefsShape } from "./refsShape.js";

export class CoMapMeta<Shape extends BaseCoMapShape>
    implements CoValueMetaBase
{
    _raw: RawCoMap<RawShape<Shape>>;
    owner: Account | Group;
    refs: RefsShape<Shape>;
    loadedAs: ControlledAccount;

    constructor(raw: RawCoMap<RawShape<Shape>>, refs: RefsShape<Shape>) {
        this._raw = raw;
        this.refs = refs;
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = SimpleGroup.fromRaw(rawOwner);
        }
        this.loadedAs = SimpleAccount.ControlledSchema.fromRaw(
            this._raw.core.node.account as RawControlledAccount
        );
    }

    get core() {
        return this._raw.core;
    }
}
