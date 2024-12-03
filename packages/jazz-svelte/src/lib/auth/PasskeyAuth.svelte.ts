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

  // Function to create a new auth instance
  function createAuthInstance() {
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
              // First set state to loading
              state = { state: "loading", errors: [] };
              // Then trigger logout
              next.logOut();
              // Create new instance to trigger onReady
              createAuthInstance();
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
  }

  // Initialize the auth instance on mount
  onMount(() => {
    createAuthInstance();
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
