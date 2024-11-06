import { AgentSecret } from "cojson";
import { BrowserDemoAuth } from "jazz-browser";
import { Account, ID } from "jazz-tools";
import { onUnmounted, reactive, ref } from "vue";
import { logoutHandler } from "../createJazzVueApp.js";

export type DemoAuthState = (
  | {
      state: "uninitialized";
    }
  | {
      state: "loading";
    }
  | {
      state: "ready";
      existingUsers: string[];
      signUp: (username: string) => void;
      logInAs: (existingUser: string) => void;
    }
  | {
      state: "signedIn";
      logOut: () => void;
    }
) & {
  errors: string[];
};

/** @category Auth Providers */
export function useDemoAuth({
  seedAccounts,
}: {
  seedAccounts?: {
    [name: string]: { accountID: ID<Account>; accountSecret: AgentSecret };
  };
} = {}) {
  const state = reactive<DemoAuthState>({
    state: "loading",
    errors: [],
  });

  const authMethod = ref(
    new BrowserDemoAuth(
      {
        onReady: ({ signUp, existingUsers, logInAs }) => {
          state.state = "ready";
          (state as DemoAuthState & { state: "ready" }).signUp = signUp;
          (state as DemoAuthState & { state: "ready" }).existingUsers =
            existingUsers;
          (state as DemoAuthState & { state: "ready" }).logInAs = logInAs;
          state.errors = [];
        },
        onSignedIn: ({ logOut }) => {
          state.state = "signedIn";
          (state as DemoAuthState & { state: "signedIn" }).logOut = () => {
            logOut();
            state.state = "ready";
            state.errors = [];
          };
          state.errors = [];
          logoutHandler.value = (
            state as DemoAuthState & { state: "signedIn" }
          ).logOut;
        },
        onError: (error) => {
          state.errors.push(error.toString());
        },
      },
      seedAccounts,
    ),
  );
  onUnmounted(() => {
    if (state.state === "signedIn") {
      logoutHandler.value = undefined;
    }
  });
  return { authMethod, state };
}
