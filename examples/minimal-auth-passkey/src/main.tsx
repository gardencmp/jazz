import {
  PasskeyAuthBasicUI,
  createJazzReactApp,
  usePasskeyAuth,
} from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { MinimalAccount } from "./schema";

const Jazz = createJazzReactApp<MinimalAccount>({
  AccountSchema: MinimalAccount,
});

export const { useAccount, useCoState } = Jazz;

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, state] = usePasskeyAuth({
    appName: "Jazz Minimal Auth Passkey Example",
  });

  return (
    <>
      <Jazz.Provider
        auth={auth}
        peer="wss://cloud.jazz.tools/?key=minimal-auth-passkey-example@gcmp.io"
      >
        {children}
      </Jazz.Provider>
      <PasskeyAuthBasicUI state={state} />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzAndAuth>
      <App />
    </JazzAndAuth>
  </StrictMode>,
);
