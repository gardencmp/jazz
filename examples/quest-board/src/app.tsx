import { useIframeHashRouter } from "hash-slash";
import { DemoAuthBasicUI, createJazzReactApp, useDemoAuth } from "jazz-react";
import { ID } from "jazz-tools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import GuildMasterPage from "./app/GuildMasterPage.tsx";
import InvitePage from "./app/InvitePage.tsx";
import ProposalPage from "./app/ProposalPage.tsx";
import { QuestBoard, QuestBoardAccount } from "./schema.ts";

const Jazz = createJazzReactApp({
  AccountSchema: QuestBoardAccount,
});
export const { useAccount, useCoState, useAcceptInvite } = Jazz;

function App() {
  const [auth, state] = useDemoAuth();
  const router = useIframeHashRouter();

  return (
    <>
      <Jazz.Provider
        auth={auth}
        // peer="wss://cloud.jazz.tools/?key=chat-example-jazz@garden.co"
        peer="ws://localhost:4200"
      >
        {router.route({
          "/": () => <GuildMasterPage />,
          "/invite/:id": () => (
            <InvitePage
              onAcceptInvite={(id) => router.navigate(`/#/board/${id}`)}
            />
          ),
          "/board/:id": (id) => <ProposalPage boardID={id as ID<QuestBoard>} />,
        })}
      </Jazz.Provider>
      {state.state !== "signedIn" && (
        <DemoAuthBasicUI appName="Jazz Quest Board" state={state} />
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
