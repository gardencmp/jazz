/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Account,
  AgentID,
  AnonymousJazzAgent,
  AuthMethod,
  CoValue,
  CoValueClass,
  CryptoProvider,
  ID,
  InviteSecret,
  SessionID,
  cojsonInternals,
  createJazzContext,
} from "jazz-tools";

import NetInfo from "@react-native-community/netinfo";
import { RawAccountID } from "cojson";
import { createWebSocketPeer } from "cojson-transport-ws";
import * as Linking from "expo-linking";
import { PureJSCrypto } from "jazz-tools/native";

export { RNDemoAuth } from "./auth/DemoAuthMethod.js";

import { createWebSocketPeerWithReconnection } from "./createWebSocketPeerWithReconnection.js";
import { KvStoreContext } from "./storage/kv-store-context.js";

/** @category Context Creation */
export type ReactNativeContext<Acc extends Account> = {
  me: Acc;
  logOut: () => void;
  // TODO: Symbol.dispose?
  done: () => void;
};

export type ReactNativeGuestContext = {
  guest: AnonymousJazzAgent;
  logOut: () => void;
  done: () => void;
};

export type ReactNativeContextOptions<Acc extends Account> = {
  auth: AuthMethod;
  AccountSchema: CoValueClass<Acc> & {
    fromNode: (typeof Account)["fromNode"];
  };
} & BaseReactNativeContextOptions;

export type BaseReactNativeContextOptions = {
  peer: `wss://${string}` | `ws://${string}`;
  reconnectionTimeout?: number;
  storage?: "indexedDB" | "singleTabOPFS";
  crypto?: CryptoProvider;
};

/** @category Context Creation */
export async function createJazzRNContext<Acc extends Account>(
  options: ReactNativeContextOptions<Acc>,
): Promise<ReactNativeContext<Acc>>;
export async function createJazzRNContext(
  options: BaseReactNativeContextOptions,
): Promise<ReactNativeGuestContext>;
export async function createJazzRNContext<Acc extends Account>(
  options: ReactNativeContextOptions<Acc> | BaseReactNativeContextOptions,
): Promise<ReactNativeContext<Acc> | ReactNativeGuestContext>;
export async function createJazzRNContext<Acc extends Account>(
  options: ReactNativeContextOptions<Acc> | BaseReactNativeContextOptions,
): Promise<ReactNativeContext<Acc> | ReactNativeGuestContext> {
  const websocketPeer = createWebSocketPeerWithReconnection(
    options.peer,
    options.reconnectionTimeout,
    (peer) => {
      node.syncManager.addPeer(peer);
    },
  );

  const context =
    "auth" in options
      ? await createJazzContext({
          AccountSchema: options.AccountSchema,
          auth: options.auth,
          crypto: await PureJSCrypto.create(),
          peersToLoadFrom: [websocketPeer.peer],
          sessionProvider: provideLockSession,
        })
      : await createJazzContext({
          crypto: await PureJSCrypto.create(),
          peersToLoadFrom: [websocketPeer.peer],
        });

  const node =
    "account" in context ? context.account._raw.core.node : context.agent.node;

  return "account" in context
    ? {
        me: context.account,
        done: () => {
          websocketPeer.done();
          context.done();
        },
        logOut: () => {
          context.logOut();
        },
      }
    : {
        guest: context.agent,
        done: () => {
          websocketPeer.done();
          context.done();
        },
        logOut: () => {
          context.logOut();
        },
      };
}

/** @category Auth Providers */
export type SessionProvider = (
  accountID: ID<Account> | AgentID,
) => Promise<SessionID>;

export async function provideLockSession(
  accountID: ID<Account> | AgentID,
  crypto: CryptoProvider,
) {
  const sessionDone = () => {};

  const kvStore = KvStoreContext.getInstance().getStorage();

  const sessionID =
    ((await kvStore.get(accountID)) as SessionID) ||
    crypto.newRandomSessionID(accountID as RawAccountID | AgentID);
  await kvStore.set(accountID, sessionID);

  return Promise.resolve({
    sessionID,
    sessionDone,
  });
}

/** @category Invite Links */
export function createInviteLink<C extends CoValue>(
  value: C,
  role: "reader" | "writer" | "admin",
  { baseURL, valueHint }: { baseURL?: string; valueHint?: string } = {},
): string {
  const coValueCore = value._raw.core;
  let currentCoValue = coValueCore;

  while (currentCoValue.header.ruleset.type === "ownedByGroup") {
    currentCoValue = currentCoValue.getGroup().core;
  }

  if (currentCoValue.header.ruleset.type !== "group") {
    throw new Error("Can't create invite link for object without group");
  }

  const group = cojsonInternals.expectGroup(currentCoValue.getCurrentContent());
  const inviteSecret = group.createInvite(role);

  return `${baseURL}/invite/${valueHint ? valueHint + "/" : ""}${
    value.id
  }/${inviteSecret}`;
}

/** @category Invite Links */
export function parseInviteLink<C extends CoValue>(
  inviteURL: string,
):
  | {
      valueID: ID<C>;
      valueHint?: string;
      inviteSecret: InviteSecret;
    }
  | undefined {
  const url = Linking.parse(inviteURL);
  const parts = url.path?.split("/");

  if (!parts || parts[0] !== "invite") {
    return undefined;
  }

  let valueHint: string | undefined;
  let valueID: ID<C> | undefined;
  let inviteSecret: InviteSecret | undefined;

  if (parts.length === 4) {
    valueHint = parts[1];
    valueID = parts[2] as ID<C>;
    inviteSecret = parts[3] as InviteSecret;
  } else if (parts.length === 3) {
    valueID = parts[1] as ID<C>;
    inviteSecret = parts[2] as InviteSecret;
  }

  if (!valueID || !inviteSecret) {
    return undefined;
  }

  return { valueID, inviteSecret, valueHint };
}

/////////

export * from "./provider.js";
export * from "./auth/auth.js";
export * from "./storage/kv-store-context.js";
