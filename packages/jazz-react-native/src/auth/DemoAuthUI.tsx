import { AgentSecret } from "cojson";
import { Account, ID } from "jazz-tools";
import React, { useMemo, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KvStore } from "../storage/kv-store-context.js";
import { RNDemoAuth } from "./DemoAuthMethod.js";

type DemoAuthState = (
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
  store,
}: {
  seedAccounts?: {
    [name: string]: { accountID: ID<Account>; accountSecret: AgentSecret };
  };
  store?: KvStore;
} = {}) {
  const [state, setState] = useState<DemoAuthState>({
    state: "loading",
    errors: [],
  });

  const [authMethod, setAuthMethod] = useState<RNDemoAuth | null>(null);

  const authMethodPromise = useMemo(() => {
    return RNDemoAuth.init(
      {
        onReady: async ({ signUp, getExistingUsers, logInAs }) => {
          const existingUsers = await getExistingUsers();
          setState({
            state: "ready",
            signUp,
            existingUsers,
            logInAs,
            errors: [],
          });
        },
        onSignedIn: ({ logOut }) => {
          setState({ state: "signedIn", logOut, errors: [] });
        },
        onError: (error) => {
          setState((current) => ({
            ...current,
            errors: [...current.errors, error.toString()],
          }));
        },
      },
      seedAccounts,
      store,
    );
  }, [seedAccounts]);

  useEffect(() => {
    async function init() {
      try {
        const auth = await authMethodPromise;
        setAuthMethod(auth);
      } catch (e: unknown) {
        const err = e as Error;
        setState((current) => ({
          ...current,
          errors: [...current.errors, err.toString()],
        }));
      }
    }
    if (authMethod) return;
    void init();
  }, [seedAccounts]);

  return [authMethod, state] as const;
}

export const DemoAuthBasicUI = ({
  appName,
  state,
}: {
  appName: string;
  state: DemoAuthState;
}) => {
  const darkMode = false;
  const [username, setUsername] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignUp = () => {
    if (state.state !== "ready") return;
    if (username.trim() === "") {
      setErrorMessage("Display name is required");
    } else {
      setErrorMessage(null);
      state.signUp(username);
    }
  };

  return (
    <View
      style={[
        styles.container,
        darkMode ? styles.darkBackground : styles.lightBackground,
      ]}
    >
      {state.state === "loading" ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : state.state === "ready" ? (
        <View style={styles.formContainer}>
          <Text
            style={[
              styles.headerText,
              darkMode ? styles.darkText : styles.lightText,
            ]}
          >
            {appName}
          </Text>

          {state.errors.map((error) => (
            <Text key={error} style={styles.errorText}>
              {error}
            </Text>
          ))}

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <TextInput
            placeholder="Display name"
            value={username}
            onChangeText={setUsername}
            placeholderTextColor={darkMode ? "#fff" : "#000"}
            style={[
              styles.textInput,
              darkMode ? styles.darkInput : styles.lightInput,
            ]}
          />

          <TouchableOpacity
            onPress={handleSignUp}
            style={[
              styles.button,
              darkMode ? styles.darkButton : styles.lightButton,
            ]}
          >
            <Text
              style={darkMode ? styles.darkButtonText : styles.lightButtonText}
            >
              Sign Up as new account
            </Text>
          </TouchableOpacity>

          <View style={styles.existingUsersContainer}>
            {state.existingUsers.map((user) => (
              <TouchableOpacity
                key={user}
                onPress={() => state.logInAs(user)}
                style={[
                  styles.existingUserButton,
                  darkMode ? styles.darkUserButton : styles.lightUserButton,
                ]}
              >
                <Text style={darkMode ? styles.darkText : styles.lightText}>
                  Log In as "{user}"
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formContainer: {
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 24,
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    marginVertical: 5,
    textAlign: "center",
  },
  textInput: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    width: "100%",
    borderRadius: 6,
  },
  darkInput: {
    borderColor: "#444",
    backgroundColor: "#000",
    color: "#fff",
  },
  lightInput: {
    borderColor: "#ddd",
    backgroundColor: "#fff",
    color: "#000",
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 6,
    width: "100%",
    marginVertical: 10,
  },
  darkButton: {
    backgroundColor: "#444",
  },
  lightButton: {
    backgroundColor: "#ddd",
  },
  darkButtonText: {
    color: "#fff",
    textAlign: "center",
  },
  lightButtonText: {
    color: "#000",
    textAlign: "center",
  },
  existingUsersContainer: {
    width: "100%",
    marginTop: 20,
  },
  existingUserButton: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginVertical: 5,
  },
  darkUserButton: {
    backgroundColor: "#222",
  },
  lightUserButton: {
    backgroundColor: "#eee",
  },
  loadingText: {
    fontSize: 18,
    color: "#888",
  },
  darkText: {
    color: "#fff",
  },
  lightText: {
    color: "#000",
  },
  darkBackground: {
    backgroundColor: "#000",
  },
  lightBackground: {
    backgroundColor: "#fff",
  },
});
