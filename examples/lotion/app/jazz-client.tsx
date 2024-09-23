"use client";

import { createJazzReactApp } from "jazz-react";
import {
  Account,
  fixedCredentialsAuth,
  ID,
} from "jazz-tools";

const JazzClient = createJazzReactApp();
export const { useCoState } = JazzClient;

export function JazzClientContext({
  children,
  credentials,
}: {
  children: React.ReactNode;
  credentials: {
    accountID: ID<Account>;
    secret: `sealerSecret_z${string}/signerSecret_z${string}`;
  };
}) {
  return (
    <JazzClient.Provider
      auth={fixedCredentialsAuth(credentials)}
      peer="wss://mesh.jazz.tools/?key=you@example.com"
    >
      {children}
    </JazzClient.Provider>
  );
}
