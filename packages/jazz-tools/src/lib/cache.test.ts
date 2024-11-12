import { RawCoValue } from "cojson";
import { describe, expect, test } from "vitest";
import { CoValue } from "../internal.js";
import { coValuesCache } from "./cache.js";

describe("coValuesCache", () => {
  test("should return computed value when not cached", () => {
    const mockRawValue = { type: "comap" } as RawCoValue;
    const mockCoValue = { id: "test" } as unknown as CoValue;
    let computeCalls = 0;

    const result = coValuesCache.get(mockRawValue, () => {
      computeCalls++;
      return mockCoValue;
    });

    expect(result).toBe(mockCoValue);
    expect(computeCalls).toBe(1);
  });

  test("should return cached value on subsequent calls", () => {
    const mockRawValue = { type: "comap" } as RawCoValue;
    const mockCoValue = { id: "test" } as unknown as CoValue;
    let computeCalls = 0;

    // First call
    const result1 = coValuesCache.get(mockRawValue, () => {
      computeCalls++;
      return mockCoValue;
    });

    // Second call with same raw value
    const result2 = coValuesCache.get(mockRawValue, () => {
      computeCalls++;
      return mockCoValue;
    });

    expect(result1).toBe(mockCoValue);
    expect(result2).toBe(mockCoValue);
    expect(computeCalls).toBe(1); // Compute should only be called once
  });

  test("should cache different values for different raw values", () => {
    const mockRawValue1 = { type: "comap" } as RawCoValue;
    const mockRawValue2 = { type: "colist" } as RawCoValue;
    const mockCoValue1 = { id: "test1" } as unknown as CoValue;
    const mockCoValue2 = { id: "test2" } as unknown as CoValue;
    let computeCalls = 0;

    const result1 = coValuesCache.get(mockRawValue1, () => {
      computeCalls++;
      return mockCoValue1;
    });

    const result2 = coValuesCache.get(mockRawValue2, () => {
      computeCalls++;
      return mockCoValue2;
    });

    expect(result1).toBe(mockCoValue1);
    expect(result2).toBe(mockCoValue2);
    expect(computeCalls).toBe(2); // Should compute once for each unique raw value
  });
});
