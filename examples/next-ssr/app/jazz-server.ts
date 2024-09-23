import "next/server";
import { hardcodedUserCredentials } from "./hardcodedUserCredentials";
import { startWorker } from "jazz-nodejs";

export const JazzSSRPromise = startWorker({
  accountID: hardcodedUserCredentials.accountID,
  accountSecret: hardcodedUserCredentials.secret,
  syncServer: "wss://mesh.jazz.tools/?key=you@example.com",
});
