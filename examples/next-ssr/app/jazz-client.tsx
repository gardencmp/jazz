"use client";

import { createJazzReactApp } from "jazz-react";
import {
  Account,
  fixedCredentialsAuth,
  ID,
} from "jazz-tools";

const JazzClient = createJazzReactApp();
export const { useCoState, useAccount } = JazzClient;

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
      auth={{
        async start(crypto) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return fixedCredentialsAuth(credentials).start(crypto)
        }
      }}

      peer="wss://mesh.jazz.tools/?key=you@example.com"
    >
      {children}
    </JazzClient.Provider>
  );
}
