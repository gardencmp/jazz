import {
  AgentSecret,
  CoID,
  ControlledAgent,
  CryptoProvider,
  LocalNode,
  Peer,
  RawAccount,
  RawAccountID,
  SessionID,
} from "cojson";
import { Account, AccountClass } from "../coValues/account.js";
import { ID } from "../coValues/interfaces.js";

export type Credentials = {
  accountID: ID<Account>;
  secret: AgentSecret;
};

export type AuthResult =
  | {
      type: "existing";
      credentials: Credentials;
      saveCredentials?: (credentials: Credentials) => Promise<void>;
      onSuccess: () => void;
      onError: (error: string | Error) => void;
      logOut: () => void;
    }
  | {
      type: "new";
      creationProps: { name: string };
      initialSecret?: AgentSecret;
      saveCredentials: (credentials: Credentials) => Promise<void>;
      onSuccess: () => void;
      onError: (error: string | Error) => void;
      logOut: () => void;
    };

export interface AuthMethod {
  start(crypto: CryptoProvider): Promise<AuthResult>;
}

export const fixedCredentialsAuth = (credentials: {
  accountID: ID<Account>;
  secret: AgentSecret;
}): AuthMethod => {
  return {
    start: async () => ({
      type: "existing",
      credentials,
      saveCredentials: async () => {},
      onSuccess: () => {},
      onError: () => {},
      logOut: () => {},
    }),
  };
};

export const ephemeralCredentialsAuth = (): AuthMethod => {
  return {
    start: async () => ({
      type: "new",
      creationProps: { name: "Ephemeral" },
      saveCredentials: async () => {},
      onSuccess: () => {},
      onError: () => {},
      logOut: () => {},
    }),
  };
};

export async function randomSessionProvider(
  accountID: ID<Account>,
  crypto: CryptoProvider,
) {
  return {
    sessionID: crypto.newRandomSessionID(accountID as unknown as RawAccountID),
    sessionDone: () => {},
  };
}

type ContextParamsWithAuth<Acc extends Account> = {
  AccountSchema?: AccountClass<Acc>;
  auth: AuthMethod;
  sessionProvider: (
    accountID: ID<Account>,
    crypto: CryptoProvider,
  ) => Promise<{ sessionID: SessionID; sessionDone: () => void }>;
} & BaseContextParams;

type BaseContextParams = {
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
};

export type JazzContextWithAccount<Acc extends Account> = {
  account: Acc;
  done: () => void;
  logOut: () => void;
};

export type JazzContextWithAgent = {
  agent: AnonymousJazzAgent;
  done: () => void;
  logOut: () => void;
};

export type JazzContext<Acc extends Account> =
  | JazzContextWithAccount<Acc>
  | JazzContextWithAgent;

export async function createJazzContext<Acc extends Account>({
  AccountSchema,
  auth,
  sessionProvider,
  peersToLoadFrom,
  crypto,
}: ContextParamsWithAuth<Acc>): Promise<JazzContextWithAccount<Acc>>;
export async function createJazzContext({
  peersToLoadFrom,
  crypto,
}: BaseContextParams): Promise<JazzContextWithAgent>;
export async function createJazzContext<Acc extends Account>(
  options: ContextParamsWithAuth<Acc> | BaseContextParams,
): Promise<JazzContext<Acc>>;
export async function createJazzContext<Acc extends Account>(
  options: ContextParamsWithAuth<Acc> | BaseContextParams,
): Promise<JazzContext<Acc>> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!("auth" in options)) {
      return createAnonymousJazzContext({
        peersToLoadFrom: options.peersToLoadFrom,
        crypto: options.crypto,
      });
    }

    const { auth, sessionProvider, peersToLoadFrom, crypto } = options;
    const AccountSchema =
      options.AccountSchema ?? (Account as unknown as AccountClass<Acc>);
    let authResult: AuthResult;
    try {
      authResult = await auth.start(crypto);
    } catch (e) {
      console.error("error", e);
      throw e;
    }

    if (authResult.type === "existing") {
      try {
        const { sessionID, sessionDone } = await sessionProvider(
          authResult.credentials.accountID,
          crypto,
        );

        try {
          const node = await LocalNode.withLoadedAccount({
            accountID: authResult.credentials
              .accountID as unknown as CoID<RawAccount>,
            accountSecret: authResult.credentials.secret,
            sessionID: sessionID,
            peersToLoadFrom: peersToLoadFrom,
            crypto: crypto,
            migration: async (rawAccount, _node, creationProps) => {
              const account = new AccountSchema({
                fromRaw: rawAccount,
              }) as Acc;

              await account.migrate?.(creationProps);
            },
          });

          const account = AccountSchema.fromNode(node);

          if (authResult.saveCredentials) {
            await authResult.saveCredentials({
              accountID: node.account.id as unknown as ID<Account>,
              secret: node.account.agentSecret,
            });
          }

          authResult.onSuccess();

          return {
            account,
            done: () => {
              node.gracefulShutdown();
              sessionDone();
            },
            logOut: () => {
              node.gracefulShutdown();
              sessionDone();
              authResult.logOut();
            },
          };
        } catch (e) {
          authResult.onError(new Error("Error loading account", { cause: e }));
          sessionDone();
        }
      } catch (e) {
        authResult.onError(
          new Error("Error acquiring sessionID", { cause: e }),
        );
      }
    } else if (authResult.type === "new") {
      try {
        // TODO: figure out a way to not "waste" the first SessionID
        const { node } = await LocalNode.withNewlyCreatedAccount({
          creationProps: authResult.creationProps,
          peersToLoadFrom: peersToLoadFrom,
          crypto: crypto,
          initialAgentSecret: authResult.initialSecret,
          migration: async (rawAccount, _node, creationProps) => {
            const account = new AccountSchema({
              fromRaw: rawAccount,
            }) as Acc;

            await account.migrate?.(creationProps);
          },
        });

        const account = AccountSchema.fromNode(node);

        await authResult.saveCredentials({
          accountID: node.account.id as unknown as ID<Account>,
          secret: node.account.agentSecret,
        });

        authResult.onSuccess();
        return {
          account,
          done: () => {
            node.gracefulShutdown();
          },
          logOut: () => {
            node.gracefulShutdown();
            authResult.logOut();
          },
        };
      } catch (e) {
        authResult.onError(new Error("Error creating account", { cause: e }));
      }
    }
  }
}

export class AnonymousJazzAgent {
  _type = "Anonymous" as const;
  constructor(public node: LocalNode) {}
}

export async function createAnonymousJazzContext({
  peersToLoadFrom,
  crypto,
}: {
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
}): Promise<JazzContextWithAgent> {
  const agentSecret = crypto.newRandomAgentSecret();
  const rawAgent = new ControlledAgent(agentSecret, crypto);

  const node = new LocalNode(
    rawAgent,
    crypto.newRandomSessionID(rawAgent.id),
    crypto,
  );

  for (const peer of peersToLoadFrom) {
    node.syncManager.addPeer(peer);
  }

  return {
    agent: new AnonymousJazzAgent(node),
    done: () => {},
    logOut: () => {},
  };
}
