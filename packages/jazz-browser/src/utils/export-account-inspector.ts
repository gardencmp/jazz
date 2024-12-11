import { AgentSecret } from "cojson";
import { Account } from "jazz-tools/src/coValues/account.js";
import { ID } from "jazz-tools/src/coValues/interfaces.js";

function exportAccountToInspector(localStorageKey = "jazz-logged-in-secret") {
  const localStorageData = JSON.parse(localStorage[localStorageKey]) as {
    accountID: ID<Account>;
    accountSecret: AgentSecret;
  };
  const encodedAccountSecret = btoa(localStorageData?.accountSecret);
  window.open(
    new URL(
      `#/import/${localStorageData?.accountID}/${encodedAccountSecret}`,
      "https://inspector.jazz.tools",
    ).toString(),
    "_blank",
  );
}

function listenForCmdJ(localStorageKey?: string) {
  if (typeof window === "undefined") return;

  const cb = (e: any) => {
    if (e.metaKey && e.key === "j") {
      if (
        confirm(
          "Are you sure you want to inspect your account using inspector.jazz.tools? This lets anyone with the secret inspector URL read your data and impersonate you.",
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

/**
 * Automatically sets up the Cmd+J listener if 'allowJazzInspector' is present in the URL
 * @returns A cleanup function if the listener was set up, undefined otherwise
 */
export function setupInspector() {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (url.hash.includes("allowJazzInspector")) {
    return listenForCmdJ();
  }
}
