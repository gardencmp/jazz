import { describe, expectTypeOf, it } from "vitest";
import { CoMap, co } from "../index.js";
import { co as valueWithCoMarker } from "../internal.js";

describe("co.json TypeScript validation", () => {
    it("should accept serializable types", async () => {
        type ValidType = { str: string; num: number; bool: boolean };

        class ValidPrimitiveMap extends CoMap {
            data = co.json<ValidType>();
        }

        expectTypeOf(ValidPrimitiveMap.create<ValidPrimitiveMap>)
            .parameter(0)
            .toEqualTypeOf<{
                data: valueWithCoMarker<ValidType>;
            }>();
    });

    it("should accept nested serializable types", async () => {
        interface NestedInterface {
            outer: {
                inner: {
                    value: string;
                };
            };
        }

        class ValidNestedMap extends CoMap {
            data = co.json<NestedInterface>();
        }

        expectTypeOf(ValidNestedMap.create<ValidNestedMap>)
            .parameter(0)
            .toEqualTypeOf<{
                data: valueWithCoMarker<NestedInterface>;
            }>();
    });

    it("should accept arrays of serializable types", async () => {
        interface ArrayInterface {
            numbers: number[];
            objects: { id: number; name: string }[];
        }

        class ValidArrayMap extends CoMap {
            data = co.json<ArrayInterface>();
        }

        expectTypeOf(ValidArrayMap.create<ValidArrayMap>)
            .parameter(0)
            .toEqualTypeOf<{
                data: valueWithCoMarker<ArrayInterface>;
            }>();
    });

    it("should flag interfaces with functions as invalid", async () => {
        interface InvalidInterface {
            func: () => void;
        }

        class InvalidFunctionMap extends CoMap {
            // @ts-expect-error Should not be considered valid
            data = co.json<InvalidInterface>();
        }

        expectTypeOf(InvalidFunctionMap.create<InvalidFunctionMap>)
            .parameter(0)
            .toEqualTypeOf<{
                data: valueWithCoMarker<InvalidInterface>;
            }>();
    });

    it("should flag types with functions as invalid", async () => {
        type InvalidType = { func: () => void };

        class InvalidFunctionMap extends CoMap {
            // @ts-expect-error Should not be considered valid
            data = co.json<InvalidType>();
        }

        expectTypeOf(InvalidFunctionMap.create<InvalidFunctionMap>)
            .parameter(0)
            .toEqualTypeOf<{
                data: valueWithCoMarker<InvalidType>;
            }>();
    });

    it("should flag types with non-serializable constructors as invalid", async () => {
        type InvalidType = { date: Date; regexp: RegExp; symbol: symbol };

        class InvalidFunctionMap extends CoMap {
            // @ts-expect-error Should not be considered valid
            data = co.json<InvalidType>();
        }

        expectTypeOf(InvalidFunctionMap.create<InvalidFunctionMap>)
            .parameter(0)
            .toEqualTypeOf<{
                data: valueWithCoMarker<InvalidType>;
            }>();
    });

    it("should apply the same validation to optional json", async () => {
        type ValidType = {
            value: string;
        };

        type InvalidType = {
            value: () => string;
        };

        class MapWithOptionalJSON extends CoMap {
            data = co.optional.json<ValidType>();
            // @ts-expect-error Should not be considered valid
            data2 = co.optional.json<InvalidType>();
        }

        expectTypeOf(MapWithOptionalJSON.create<MapWithOptionalJSON>)
            .parameter(0)
            .toEqualTypeOf<{
                data?: valueWithCoMarker<ValidType> | null;
                data2?: valueWithCoMarker<InvalidType> | null;
            }>();
    });
});
