import { RouterProvider, createRouter } from "@tanstack/react-router";
import { DemoAuthBasicUI, createJazzReactApp, useDemoAuth } from "jazz-react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const Jazz = createJazzReactApp();
export const { useAccount, useCoState } = Jazz;

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, authState] = useDemoAuth();
  return (
    <>
      <Jazz.Provider
        auth={auth}
        // replace `you@example.com` with your email as a temporary API key
        peer="wss://cloud.jazz.tools/?key=you@example.com"
      >
        {children}
      </Jazz.Provider>
      <DemoAuthBasicUI appName="Planning Poker" state={authState} />
    </>
  );
}

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  Wrap: JazzAndAuth,
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app")!;

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
