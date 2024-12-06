import { Toaster } from "@/components/ui/toaster";
/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { HomePage } from "./3_HomePage";
import { useMediaPlayer } from "./5_useMediaPlayer";
import { InvitePage } from "./6_InvitePage";
import { PlayerControls } from "./components/PlayerControls";
import "./index.css";

import { MusicaAccount } from "@/1_schema";
import { DemoAuthBasicUI, createJazzReactApp, useDemoAuth } from "jazz-react";
import { useUploadExampleData } from "./lib/useUploadExampleData";

/**
 * Walkthrough: The top-level provider `<Jazz.Provider/>`
 *
 * This shows how to use the top-level provider `<Jazz.Provider/>`,
 * which provides the rest of the app with a controlled account (used through `useAccount` later).
 * Here we use `DemoAuth` which is great for prototyping you app without wasting time on figuring out
 * the best way to do auth.
 *
 * `<Jazz.Provider/>` also runs our account migration
 */

const Jazz = createJazzReactApp({
  AccountSchema: MusicaAccount,
});

export const { useAccount, useCoState, useAcceptInvite } = Jazz;

function Main() {
  const mediaPlayer = useMediaPlayer();

  useUploadExampleData();

  const router = createHashRouter([
    {
      path: "/",
      element: <HomePage mediaPlayer={mediaPlayer} />,
    },
    {
      path: "/playlist/:playlistId",
      element: <HomePage mediaPlayer={mediaPlayer} />,
    },
    {
      path: "/invite/*",
      element: <InvitePage />,
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <PlayerControls mediaPlayer={mediaPlayer} />
      <Toaster />
    </>
  );
}

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, state] = useDemoAuth();

  const peer =
    (new URL(window.location.href).searchParams.get(
      "peer",
    ) as `ws://${string}`) ??
    "wss://cloud.jazz.tools/?key=music-player-example-jazz@garden.co";

  return (
    <>
      <Jazz.Provider
        storage={["singleTabOPFS", "indexedDB"]}
        auth={auth}
        peer={peer}
      >
        {children}
      </Jazz.Provider>
      <DemoAuthBasicUI appName="Jazz Music Player" state={state} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JazzAndAuth>
      <Main />
    </JazzAndAuth>
  </React.StrictMode>,
);
