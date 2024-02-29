import {
    SessionID,
    CojsonInternalTypes,
    AccountID
} from "cojson";
import { CoValueBase } from "../../baseInterfaces.js";
import { Schema } from "../../schema.js";
import { ValueRef } from "../../valueRef.js";


export interface CoStreamEntry<Item extends Schema = Schema> {
    value: Item["_Value"] extends CoValueBase ? Item["_Value"] | undefined : Item["_Value"];
    ref: Item["_Value"] extends CoValueBase ? ValueRef<Item["_Value"]> : undefined;
    tx: CojsonInternalTypes.TransactionID;
    at: Date;
}

export interface CoStreamSessionEntries<Item extends Schema> {
    sessionID: SessionID;
    last?: CoStreamEntry<Item>;
    all: CoStreamEntry<Item>[];
}

export interface CoStreamAccountEntries<Item extends Schema> {
    accountID: AccountID;
    last?: CoStreamEntry<Item>;
    all: CoStreamEntry<Item>[];
}
