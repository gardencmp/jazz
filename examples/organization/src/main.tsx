import { DemoAuthBasicUI, createJazzReactApp, useDemoAuth } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { AcceptInvitePage } from "./AcceptInvitePage.tsx";
import { HomePage } from "./HomePage.tsx";
import { OrganizationPage } from "./OrganizationPage.tsx";
import { JazzAccount } from "./schema.ts";

const Jazz = createJazzReactApp({
  AccountSchema: JazzAccount,
});

export const { useAccount, useCoState, useAcceptInvite } = Jazz;
function Router() {
  const router = createHashRouter([
    {
      path: "/",
      element: <HomePage />,
    },
    {
      path: "/organizations/:organizationId",
      element: <OrganizationPage />,
    },
    {
      path: "/invite/*",
      element: <AcceptInvitePage />,
    },
  ]);

  return <RouterProvider router={router}></RouterProvider>;
}

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, authState] = useDemoAuth();

  return (
    <>
      <Jazz.Provider
        auth={auth}
        peer="wss://cloud.jazz.tools/?key=organization-example@garden.co"
      >
        {children}
      </Jazz.Provider>

      {authState.state !== "signedIn" && (
        <DemoAuthBasicUI appName="Organization" state={authState} />
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzAndAuth>
      <Router />
    </JazzAndAuth>
  </StrictMode>,
);
