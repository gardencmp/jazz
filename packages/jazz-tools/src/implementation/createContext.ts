import {
    AgentSecret,
    CoID,
    cojsonInternals,
    CryptoProvider,
    LocalNode,
    Peer,
    RawAccount,
    RawAccountID,
    SessionID,
} from "cojson";
import { Account, AccountClass, ID } from "../internal.js";

export type AuthResult =
    | {
          type: "existing";
          credentials: { accountID: ID<Account>; secret: AgentSecret };
          onSuccess: () => void;
          onError: (error: string | Error) => void;
      }
    | {
          type: "new";
          creationProps: { name: string };
          initialSecret?: AgentSecret;
          saveCredentials: (credentials: {
              accountID: ID<Account>;
              secret: AgentSecret;
          }) => Promise<void>;
          onSuccess: () => void;
          onError: (error: string | Error) => void;
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
            onSuccess: () => {},
            onError: () => {},
        }),
    };
};

export async function randomSessionProvider(accountID: ID<Account>) {
    return {
        sessionID: cojsonInternals.newRandomSessionID(
            accountID as unknown as RawAccountID,
        ),
        sessionDone: () => {},
    };
}

export async function createJazzContext<Acc extends Account>({
    AccountSchema = Account as unknown as AccountClass<Acc>,
    auth,
    sessionProvider,
    peersToLoadFrom,
    crypto,
}: {
    AccountSchema?: AccountClass<Acc>;
    auth: AuthMethod;
    sessionProvider: (
        accountID: ID<Account>,
    ) => Promise<{ sessionID: SessionID; sessionDone: () => void }>;
    peersToLoadFrom: Peer[];
    crypto: CryptoProvider;
}): Promise<{ account: Acc; done: () => void }> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const authResult = await auth.start(crypto);

        if (authResult.type === "existing") {
            try {
                const { sessionID, sessionDone } = await sessionProvider(
                    authResult.credentials.accountID,
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
                    authResult.onSuccess();

                    return {
                        account,
                        done: () => {
                            node.gracefulShutdown();
                            sessionDone();
                        },
                    };
                } catch (e) {
                    authResult.onError(
                        new Error("Error loading account", { cause: e }),
                    );
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
                };
            } catch (e) {
                authResult.onError(
                    new Error("Error creating account", { cause: e }),
                );
            }
        }
    }
}
