import { AgentSecret, LocalNode, WasmCrypto } from "cojson";
import {
  Account,
  AccountClass,
  CoValue,
  ID,
  Inbox,
  InboxMessage,
  Profile,
  createJazzContext,
  fixedCredentialsAuth,
  randomSessionProvider,
} from "jazz-tools";
import { webSocketWithReconnection } from "./webSocketWithReconnection.js";

type WorkerOptions<Acc extends Account, M extends InboxMessage<string, any>> = {
  accountID?: string;
  accountSecret?: string;
  syncServer?: string;
  AccountSchema?: AccountClass<Acc>;
  onInboxMessage?: (message: M) => Promise<void>;
};

/** @category Context Creation */
export async function startWorker<
  Acc extends Account,
  M extends InboxMessage<string, any>,
>(
  options: WorkerOptions<Acc, M>,
): Promise<{ worker: Acc; done: () => Promise<void> }> {
  const {
    accountID = process.env.JAZZ_WORKER_ACCOUNT,
    accountSecret = process.env.JAZZ_WORKER_SECRET,
    syncServer = "wss://cloud.jazz.tools",
    AccountSchema = Account as unknown as AccountClass<Acc>,
  } = options;

  let node: LocalNode | undefined = undefined;
  const wsPeer = webSocketWithReconnection(syncServer, (peer) => {
    node?.syncManager.addPeer(peer);
  });

  if (!accountID) {
    throw new Error("No accountID provided");
  }
  if (!accountSecret) {
    throw new Error("No accountSecret provided");
  }
  if (!accountID.startsWith("co_")) {
    throw new Error("Invalid accountID");
  }
  if (!accountSecret?.startsWith("sealerSecret_")) {
    throw new Error("Invalid accountSecret");
  }

  const context = await createJazzContext({
    auth: fixedCredentialsAuth({
      accountID: accountID as ID<Acc>,
      secret: accountSecret as AgentSecret,
    }),
    AccountSchema,
    // TODO: locked sessions similar to browser
    sessionProvider: randomSessionProvider,
    peersToLoadFrom: [wsPeer.peer],
    crypto: await WasmCrypto.create(),
  });

  node = context.account._raw.core.node;

  const account = context.account as Acc;

  if (!account._refs.profile?.id) {
    throw new Error("Account has no profile");
  }

  let unsubscribe = () => {};

  if (options.onInboxMessage) {
    const inbox = await Inbox.load(account);

    unsubscribe = inbox.subscribe(options.onInboxMessage);
  }

  async function done() {
    await context.account.waitForAllCoValuesSync();

    unsubscribe();
    wsPeer.done();
    context.done();
  }

  return { worker: context.account as Acc, done };
}
