import { JsonValue } from "cojson";
import { isCoValueSchema } from "../guards.js";
import { Schema } from "../schema.js";
import { ValueRef } from "../valueRef.js";
import { ControlledAccount } from "../coValues/account/account.js";
import { ID } from "../id.js";

export function ImmMapOf<
    Shape extends {
        [key: string]: Schema;
    },
>(
    shape: Shape
): Schema<{
    [K in keyof Shape]: Shape[K]["_Value"];
}> {
    class MapSchemaForShape {
        static _Value: {
            [K in keyof Shape]: Shape[K]["_Value"];
        };
        rawValue: {
            [K in keyof Shape]: JsonValue;
        };
        loadedAs: ControlledAccount;

        constructor(
            rawValue: {
                [K in keyof Shape]: JsonValue;
            },
            loadedAs: ControlledAccount
        ) {
            this.rawValue = rawValue;
            this.loadedAs = loadedAs;
        }
    }

    for (const key in shape) {
        const keySchema = shape[key];
        if (isCoValueSchema(keySchema)) {
            Object.defineProperty(MapSchemaForShape.prototype, key, {
                get() {
                    return ValueRef(
                        this.rawValue[key] as ID<Shape[typeof key]["_Value"]>,
                        keySchema,
                        this.loadedAs
                    );
                },
            });
        } else {
            Object.defineProperty(MapSchemaForShape.prototype, key, {
                get() {
                    return this.rawValue[key] as Shape[typeof key]["_Value"];
                },
            });
        }
    }

    return MapSchemaForShape;
}
