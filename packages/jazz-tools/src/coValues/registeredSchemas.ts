import type { Account } from "./account.js";
import type { CoMap } from "./coMap.js";
import type { Group } from "./group.js";

/**
 * Regisering schemas into this Record to avoid circular dependencies.
 */
export const RegisteredSchemas = {} as {
  Account: typeof Account;
  Group: typeof Group;
  CoMap: typeof CoMap;
};
