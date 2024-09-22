import { createJazzReactApp } from "jazz-react";
import { getValueId } from "./lib/searchParams";
import { ephemeralCredentialsAuth } from "jazz-tools";
import { useState } from "react";

const key = getValueId()
  ? `downloader-e2e@jazz.tools`
  : `uploader-e2e@jazz.tools`;

const localSync = new URLSearchParams(location.search).has("localSync");

const Jazz = createJazzReactApp();

export const { useAccount, useCoState } = Jazz;

export function AuthAndJazz({ children }: { children: React.ReactNode }) {
  const [ephemeralAuth] = useState(ephemeralCredentialsAuth())

  return (
    <Jazz.Provider auth={ephemeralAuth} peer={
      localSync
        ? `ws://localhost:4200?key=${key}`
        : `wss://mesh.jazz.tools/?key=${key}`
    }>
      {children}
    </Jazz.Provider>
  );
}
