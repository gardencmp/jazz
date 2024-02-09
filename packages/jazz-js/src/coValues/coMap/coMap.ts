import {
    RawCoMap as RawCoMap,
} from "cojson";
import { subscriptionScopeSym } from "../../subscriptionScopeSym.js";
import { ID } from "../../id.js";
import { CoValueSchemaBase, CoValueBase } from "../../baseInterfaces.js";
import { Schema } from "../../schema.js";
import { Group } from "../group/group.js";
import { Account } from "../account/account.js";
import { SubscriptionScope } from "../../subscriptionScope.js";
import { RawShape } from "./rawShape.js";
import { CoMapInit } from "./init.js";
import { CoMapMeta } from "./meta.js";

// type BaseCoMapShape = { [key: string]: Schema };
export type BaseCoMapShape = Record<string, Schema>;

/** @category CoValues - CoMap */
export type CoMap<Shape extends BaseCoMapShape = BaseCoMapShape> = {
    [Key in keyof Shape]: Shape[Key]["_Value"] extends CoValueBase
        ? Shape[Key]["_Value"] | undefined
        : Shape[Key]["_Value"];
} & {
    id: ID<CoMap<Shape>>;
    meta: CoMapMeta<Shape>;
    subscribe: (listener: (newValue: CoMap<Shape>) => void) => () => void;
    [subscriptionScopeSym]?: SubscriptionScope;
} & CoValueBase;

/** @category CoValues - CoMap */
export interface CoMapSchema<Shape extends BaseCoMapShape = BaseCoMapShape>
    extends Schema<CoMap<Shape>>,
        CoValueSchemaBase<CoMap<Shape>, RawCoMap<RawShape<Shape>>> {
    _Type: "comap";
    _Shape: Shape;
    _Value: CoMap<Shape>;

    new (
        init: CoMapInit<Shape>,
        opts: { owner: Account | Group }
    ): CoMap<Shape>;

    fromRaw<Raw extends RawCoMap<RawShape<Shape>>>(raw: Raw): CoMap<Shape>;
}


