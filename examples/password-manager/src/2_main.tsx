import {
  PasskeyAuthBasicUI,
  createJazzReactApp,
  usePasskeyAuth,
} from "jazz-react";
import React from "react";
import ReactDOM from "react-dom/client";
import { PasswordManagerAccount } from "./1_schema.ts";
import App from "./5_App.tsx";
import "./index.css";

const Jazz = createJazzReactApp<PasswordManagerAccount>({
  AccountSchema: PasswordManagerAccount,
});

export const { useAccount, useCoState, useAcceptInvite } = Jazz;

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, state] = usePasskeyAuth({
    appName: "Jazz Password Manager",
  });

  return (
    <>
      <Jazz.Provider
        auth={auth}
        peer="wss://cloud.jazz.tools/?key=password-manager-example-jazz@garden.co"
      >
        {children}
      </Jazz.Provider>
      <PasskeyAuthBasicUI state={state} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JazzAndAuth>
      <App />
    </JazzAndAuth>
  </React.StrictMode>,
);
