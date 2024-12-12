import { startWorker } from "jazz-nodejs";

const { worker } = await startWorker({
  AccountSchema: MyWorkerAccount,
  syncServer: "wss://cloud.jazz.tools/?key=you@example.com",
});
