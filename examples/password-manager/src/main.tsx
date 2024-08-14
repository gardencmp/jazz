import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { createJazzReactContext, PasskeyAuth } from "jazz-react";
import { PasswordManagerAccount } from "./schema.ts";

const auth = PasskeyAuth<PasswordManagerAccount>({
  appName: "Jazz Password Manager",
  accountSchema: PasswordManagerAccount,
});

const Jazz = createJazzReactContext<PasswordManagerAccount>({
  auth,
  peer: "wss://mesh.jazz.tools/?key=you@example.com",
});

export const { useAccount, useCoState, useAcceptInvite } = Jazz;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Jazz.Provider>
    <App />
  </Jazz.Provider>
);
