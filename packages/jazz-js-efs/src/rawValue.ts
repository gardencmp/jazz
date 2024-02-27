import * as S from "@effect/schema/Schema";

type RawValue =
    | string
    | number
    | boolean
    | null
    | RawValue[]
    | { [key: string]: RawValue };

export type EnforceRawValueLikeSchema<S extends S.Schema<any>> =
    S.Schema.Context<S> extends never
        ? S.Schema.From<S> extends RawValue
            ? S
            : never // TODO: raise descriptive type error?
        : never;
