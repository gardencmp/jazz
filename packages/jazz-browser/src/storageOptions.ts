type StorageOption = "indexedDB" | "singleTabOPFS";
type CombinedStorageOption = ["singleTabOPFS", "indexedDB"];
export type StorageConfig =
  | StorageOption
  | CombinedStorageOption
  | [StorageOption];

export function getStorageOptions(storage?: StorageConfig): {
  useSingleTabOPFS: boolean;
  useIndexedDB: boolean;
} {
  const useSingleTabOPFS =
    (Array.isArray(storage) && storage.includes("singleTabOPFS")) ||
    storage === "singleTabOPFS";

  const useIndexedDB =
    !storage ||
    (Array.isArray(storage) && storage.includes("indexedDB")) ||
    storage === "indexedDB" ||
    !useSingleTabOPFS;

  return { useSingleTabOPFS, useIndexedDB };
}
