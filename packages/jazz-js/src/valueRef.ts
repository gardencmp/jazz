import { CoID } from "cojson";
import {
    CoValue,
    CoValueSchema,
    CoValueSchemaBase,
    ControlledAccount,
    ID,
} from "./index.js";

export type ValueRef<V extends CoValue> = {
    id: ID<V>;
    as: ControlledAccount;
} & (
    | {
          loaded: true;
          value: V;
      }
    | { loaded: false; value: undefined }
);

export function ValueRef<S extends CoValueSchema>(
    id: ID<S["_Value"]>,
    schema: S,
    as: ControlledAccount
): ValueRef<S["_Value"]> {
    const rawValue = as._raw.core.node.getLoaded(
        id as unknown as CoID<S["_RawValue"]>
    );
    if (rawValue) {
        return {
            id,
            as,
            loaded: true,
            value: (schema as CoValueSchemaBase).fromRaw(rawValue as unknown as S["_RawValue"]),
        };
    } else {
        return {
            id,
            as,
            loaded: false,
            value: undefined,
        };
    }
}
