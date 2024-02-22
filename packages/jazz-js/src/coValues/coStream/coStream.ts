import { RawCoStream as RawCoStream } from "cojson";
import { Account, ControlledAccount } from "../account/account.js";
import { RawType } from "../../baseInterfaces.js";
import { ID } from "../../id.js";
import { CoValueBase, CoValueSchemaBase } from "../../baseInterfaces.js";
import { Schema } from "../../schema.js";
import { Group } from "../group/group.js";
import { CoStreamSessionEntries, CoStreamAccountEntries } from "./entries.js";
import { CoStreamMeta } from "./meta.js";

export interface CoStream<Item extends Schema = Schema> extends CoValueBase {
    /** @category Collaboration */
    id: ID<CoStream<Item>>;
    /** @category Collaboration */
    meta: CoStreamMeta;
    _raw: RawCoStream<RawType<Item>>;

    bySession: CoStreamSessionEntries<Item>[];
    byAccount: CoStreamAccountEntries<Item>[];

    push(item: Item["_Value"]): void;
}

export interface CoStreamSchema<Item extends Schema = Schema>
    extends Schema<CoStream<Item>>,
        CoValueSchemaBase<CoStream<Item>, RawCoStream<RawType<Item>>> {
    _Type: "costream";
    _Item: Item;

    new (owner: Account | Group): CoStream<Item>;

    fromRaw(raw: RawCoStream<RawType<Item>>): CoStream<Item>;

    load(
        id: ID<CoStream<Item>>,
        { as }: { as: ControlledAccount }
    ): Promise<CoStream<Item>>;
}
