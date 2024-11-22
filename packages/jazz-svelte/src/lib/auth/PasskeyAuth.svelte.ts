import { BrowserPasskeyAuth } from "jazz-browser";
import { onMount } from "svelte";

export type PasskeyAuthState = (
  | { state: "uninitialized" }
  | { state: "loading" }
  | {
      state: "ready";
      logIn: () => void;
      signUp: (username: string) => void;
    }
  | { state: "signedIn"; logOut: () => void }
) & {
  errors: string[];
};

export type PasskeyAuth = {
  current?: BrowserPasskeyAuth;
  state: PasskeyAuthState;
};

/** @category Auth Providers */
export function usePasskeyAuth({
  appName,
  appHostname,
}: {
  appName: string;
  appHostname?: string;
}): PasskeyAuth {
  let instance = $state<BrowserPasskeyAuth>();
  let state = $state<PasskeyAuthState>({
    state: "loading",
    errors: [],
  });

  // Initialize the passkey auth on mount
  onMount(() => {
    instance = new BrowserPasskeyAuth(
      {
        onReady(next) {
          state = {
            state: "ready",
            logIn: next.logIn,
            signUp: next.signUp,
            errors: [],
          };
        },
        onSignedIn(next) {
          state = {
            state: "signedIn",
            logOut: () => {
              next.logOut();
              state = { state: "loading", errors: [] };
            },
            errors: [],
          };
        },
        onError(error) {
          state = {
            ...state,
            errors: [...state.errors, error.toString()],
          };
        },
      },
      appName,
      appHostname,
    );
  });

  return {
    get current() {
      return instance;
    },
    get state() {
      return state;
    },
  };
}
