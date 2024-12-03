import { isControlledAccount } from "../coValues/account";

import { connectedPeers } from "cojson/src/streamUtils.js";
import {
  Account,
  WasmCrypto,
  createJazzContext,
  fixedCredentialsAuth,
  randomSessionProvider,
} from "../index.web";

const Crypto = await WasmCrypto.create();

export async function setupAccount() {
  const me = await Account.create({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
  });

  const [initialAsPeer, secondPeer] = connectedPeers("initial", "second", {
    peer1role: "server",
    peer2role: "client",
  });

  if (!isControlledAccount(me)) {
    throw "me is not a controlled account";
  }
  me._raw.core.node.syncManager.addPeer(secondPeer);
  const { account: meOnSecondPeer } = await createJazzContext({
    auth: fixedCredentialsAuth({
      accountID: me.id,
      secret: me._raw.agentSecret,
    }),
    sessionProvider: randomSessionProvider,
    peersToLoadFrom: [initialAsPeer],
    crypto: Crypto,
  });

  return { me, meOnSecondPeer };
}

export function waitFor(callback: () => boolean | void) {
  return new Promise<void>((resolve, reject) => {
    const checkPassed = () => {
      try {
        return { ok: callback(), error: null };
      } catch (error) {
        return { ok: false, error };
      }
    };

    let retries = 0;

    const interval = setInterval(() => {
      const { ok, error } = checkPassed();

      if (ok !== false) {
        clearInterval(interval);
        resolve();
      }

      if (++retries > 10) {
        clearInterval(interval);
        reject(error);
      }
    }, 100);
  });
}
