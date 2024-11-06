import { describe, expect, test } from "vitest";
import { getStorageOptions } from "../storageOptions.js";
import { StorageConfig } from "../storageOptions.js";

describe("getStorageOptions", () => {
  test("should default to indexedDB only when no storage option is provided", () => {
    const result = getStorageOptions();
    expect(result).toEqual({
      useSingleTabOPFS: false,
      useIndexedDB: true,
    });
  });

  test("should enable only indexedDB when 'indexedDB' is provided", () => {
    const result = getStorageOptions("indexedDB");
    expect(result).toEqual({
      useSingleTabOPFS: false,
      useIndexedDB: true,
    });
  });

  test("should enable only singleTabOPFS when 'singleTabOPFS' is provided", () => {
    const result = getStorageOptions("singleTabOPFS");
    expect(result).toEqual({
      useSingleTabOPFS: true,
      useIndexedDB: false,
    });
  });

  test("should enable both when array with both options is provided", () => {
    const result = getStorageOptions(["singleTabOPFS", "indexedDB"]);
    expect(result).toEqual({
      useSingleTabOPFS: true,
      useIndexedDB: true,
    });
  });

  test("should enable only indexedDB when array with only indexedDB is provided", () => {
    const result = getStorageOptions(["indexedDB"]);
    expect(result).toEqual({
      useSingleTabOPFS: false,
      useIndexedDB: true,
    });
  });

  test("should enable only singleTabOPFS when array with only singleTabOPFS is provided", () => {
    const result = getStorageOptions(["singleTabOPFS"]);
    expect(result).toEqual({
      useSingleTabOPFS: true,
      useIndexedDB: false,
    });
  });

  test("should fallback to indexedDB when singleTabOPFS is not available", () => {
    // Testing the fallback behavior when storage is undefined
    const result = getStorageOptions(undefined);
    expect(result.useIndexedDB).toBe(true);

    // Testing with an empty array (invalid case but should fallback safely)
    const result2 = getStorageOptions([] as unknown as StorageConfig);
    expect(result2.useIndexedDB).toBe(true);
  });

  // Type checking tests
  test("should handle type checking for StorageConfig", () => {
    // These should compile without type errors
    getStorageOptions("indexedDB");
    getStorageOptions("singleTabOPFS");
    getStorageOptions(["singleTabOPFS", "indexedDB"]);
    getStorageOptions(["indexedDB"]);
    getStorageOptions(["singleTabOPFS"]);
    getStorageOptions(undefined);
  });
});
