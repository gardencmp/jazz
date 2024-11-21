import { AgentSecret } from "cojson";
import { Account } from "../coValues/account";
import { ID } from "../coValues/interfaces";

function exportAccountToInspector(localStorageKey = "jazz-logged-in-secret") {
  const localStorageData = JSON.parse(localStorage[localStorageKey]) as {
    accountID: ID<Account>;
    accountSecret: AgentSecret;
  };
  const encodedAccountSecret = btoa(localStorageData?.accountSecret);
  window.open(
    `https://inspector.jazz.tools/#/import/${localStorageData?.accountID}/${encodedAccountSecret}`,
    "_blank",
  );
}

/**
 * Sets up a keyboard shortcut (Cmd+J) to export the current account to the Jazz Inspector tool.
 *
 * @categoryDescription Declaration
 * This function adds a global keyboard listener that watches for Cmd+J (or Ctrl+J on Windows).
 * When triggered, it prompts for confirmation before exporting the account details to the Jazz Inspector.
 *
 * @example
 * ```ts
 * import { listenForCmdJ } from "jazz-tools";
 *
 * // Set up the keyboard shortcut with default localStorage key
 * const cleanup = listenForCmdJ();
 *
 * // Or specify a custom localStorage key
 * const cleanup = listenForCmdJ("custom-storage-key");
 *
 * // Later, clean up the event listener
 * cleanup();
 * ```
 *
 * @param localStorageKey - Optional key to use when reading from localStorage. Defaults to 'jazz-logged-in-secret'
 * @returns A cleanup function that removes the event listener when called
 *
 * @category Other
 **/
export function listenForCmdJ(localStorageKey?: string) {
  if (typeof window === "undefined") return;

  const cb = (e: any) => {
    if (e.metaKey && e.key === "j") {
      if (
        confirm(
          "Are you sure you want to export your account to the inspector?",
        )
      ) {
        exportAccountToInspector(localStorageKey);
      }
    }
  };

  window.addEventListener("keydown", cb);

  return () => {
    window.removeEventListener("keydown", cb);
  };
}
