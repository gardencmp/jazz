import type { JsonValue, RawCoValue } from "cojson";
import {
    type CoValue,
    type CoValueClass,
    isCoValueClass,
    CoValueFromRaw,
} from "../internal.js";

export type CoMarker = { readonly __co: unique symbol };
/** @category Schema definition */
export type co<T> = T | (T & CoMarker);
export type IfCo<C, R> = C extends infer _A | infer B
    ? B extends CoMarker
        ? R
        : never
    : never;
export type UnCo<T> = T extends co<infer A> ? A : T;

const optional = {
    ref: optionalRef,
    json<T extends JsonValue>(): co<T | undefined> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { [SchemaInit]: "json" satisfies Schema } as any;
    },
    encoded<T>(arg: OptionalEncoder<T>): co<T | undefined> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { [SchemaInit]: { encoded: arg } satisfies Schema } as any;
    },
    string: {
        [SchemaInit]: "json" satisfies Schema,
    } as unknown as co<string | undefined>,
    number: {
        [SchemaInit]: "json" satisfies Schema,
    } as unknown as co<number | undefined>,
    boolean: {
        [SchemaInit]: "json" satisfies Schema,
    } as unknown as co<boolean | undefined>,
    null: {
        [SchemaInit]: "json" satisfies Schema,
    } as unknown as co<null | undefined>,
    literal<T extends (string | number | boolean)[]>(
        ..._lit: T
    ): co<T[number] | undefined> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { [SchemaInit]: "json" satisfies Schema } as any;
    },
};

/** @category Schema definition */
export const co = {
    string: {
        [SchemaInit]: "json" satisfies Schema,
    } as unknown as co<string>,
    number: {
        [SchemaInit]: "json" satisfies Schema,
    } as unknown as co<number>,
    boolean: {
        [SchemaInit]: "json" satisfies Schema,
    } as unknown as co<boolean>,
    null: {
        [SchemaInit]: "json" satisfies Schema,
    } as unknown as co<null>,
    literal<T extends (string | number | boolean)[]>(
        ..._lit: T
    ): co<T[number]> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { [SchemaInit]: "json" satisfies Schema } as any;
    },
    json<T extends JsonValue>(): co<T> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { [SchemaInit]: "json" satisfies Schema } as any;
    },
    encoded<T>(arg: Encoder<T>): co<T> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { [SchemaInit]: { encoded: arg } satisfies Schema } as any;
    },
    ref,
    items: ItemsSym as ItemsSym,
    members: MembersSym as MembersSym,
    optional,
};

function optionalRef<C extends CoValueClass>(
    arg: C | ((_raw: InstanceType<C>["_raw"]) => C),
): co<InstanceType<C> | null | undefined> {
    return ref(arg, { optional: true });
}

function ref<C extends CoValueClass>(
    arg: C | ((_raw: InstanceType<C>["_raw"]) => C),
): co<InstanceType<C> | null>;
function ref<C extends CoValueClass>(
    arg: C | ((_raw: InstanceType<C>["_raw"]) => C),
    options: { optional: true },
): co<InstanceType<C> | null | undefined>;
function ref<
    C extends CoValueClass,
    Options extends { optional?: boolean } | undefined,
>(
    arg: C | ((_raw: InstanceType<C>["_raw"]) => C),
    options?: Options,
): Options extends { optional: true }
    ? co<InstanceType<C> | null | undefined>
    : co<InstanceType<C> | null> {
    return {
        [SchemaInit]: {
            ref: arg,
            optional: options?.optional || false,
        } satisfies Schema,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
}

export type JsonEncoded = "json";
export type EncodedAs<V> = { encoded: Encoder<V> | OptionalEncoder<V> };
export type RefEncoded<V extends CoValue> = {
    ref: CoValueClass<V> | ((raw: RawCoValue) => CoValueClass<V>);
    optional: boolean;
};

export function isRefEncoded<V extends CoValue>(
    schema: Schema,
): schema is RefEncoded<V> {
    return (
        typeof schema === "object" &&
        "ref" in schema &&
        "optional" in schema &&
        typeof schema.ref === "function"
    );
}

export function instantiateRefEncoded<V extends CoValue>(
    schema: RefEncoded<V>,
    raw: RawCoValue,
): V {
    return isCoValueClass<V>(schema.ref)
        ? schema.ref.fromRaw(raw)
        : (
              schema.ref as (
                  raw: RawCoValue,
              ) => CoValueClass<V> & CoValueFromRaw<V>
          )(raw).fromRaw(raw);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Schema = JsonEncoded | RefEncoded<CoValue> | EncodedAs<any>;

export type SchemaFor<Field> = NonNullable<Field> extends CoValue
    ? RefEncoded<NonNullable<Field>>
    : NonNullable<Field> extends JsonValue
      ? JsonEncoded
      : EncodedAs<NonNullable<Field>>;

export type Encoder<V> = {
    encode: (value: V) => JsonValue;
    decode: (value: JsonValue) => V;
};
export type OptionalEncoder<V> =
    | Encoder<V>
    | {
          encode: (value: V | undefined) => JsonValue;
          decode: (value: JsonValue) => V | undefined;
      };

import { SchemaInit, ItemsSym, MembersSym } from "./symbols.js";

/** @category Schema definition */
export const Encoders = {
    Date: {
        encode: (value: Date) => value.toISOString(),
        decode: (value: JsonValue) => new Date(value as string),
    },
};
