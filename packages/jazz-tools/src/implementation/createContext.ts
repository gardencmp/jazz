import {
    AgentSecret,
    CoID,
    CryptoProvider,
    LocalNode,
    Peer,
    RawAccount,
    SessionID,
} from "cojson";
import { Account, CoValueClass, ID } from "../internal.js";

export interface AuthMethod {
    start(): Promise<
        | {
              type: "existing";
              credentials: { accountID: ID<Account>; secret: AgentSecret };
          }
        | {
              type: "new";
              creationProps: { name: string };
              saveCredentials: (credentials: {
                  accountID: ID<Account>;
                  secret: AgentSecret;
              }) => Promise<void>;
          }
    >;
    onError: (error: string | Error) => void;
}

export async function createJazzContext<A extends Account>({
    AccountSchema = Account as unknown as CoValueClass<A> & {
        fromNode: (typeof Account)["fromNode"];
    },
    auth,
    sessionProvider,
    peersToLoadFrom,
    crypto,
}: {
    AccountSchema: CoValueClass<A> & { fromNode: (typeof Account)["fromNode"] };
    auth: AuthMethod;
    sessionProvider: (
        accountID: ID<Account>,
    ) => Promise<{ sessionID: SessionID; sessionDone: () => void }>;
    peersToLoadFrom: Peer[];
    crypto: CryptoProvider;
}): Promise<{ account: A; done: () => void }> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const authResult = await auth.start();

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
                            }) as A;

                            await account.migrate?.(creationProps);
                        },
                    });

                    return {
                        account: AccountSchema.fromNode(node),
                        done: () => {
                            node.gracefulShutdown();
                            sessionDone();
                        }
                    };
                } catch (e) {
                    auth.onError(
                        new Error("Error loading account", { cause: e }),
                    );
                    sessionDone();
                }
            } catch (e) {
                auth.onError(
                    new Error("Error acquiring sessionID", { cause: e }),
                );
            }
        } else if (authResult.type === "new") {
            try {
                const { node } = await LocalNode.withNewlyCreatedAccount({
                    creationProps: authResult.creationProps,
                    peersToLoadFrom: peersToLoadFrom,
                    crypto: crypto,
                    migration: async (rawAccount, _node, creationProps) => {
                        const account = new AccountSchema({
                            fromRaw: rawAccount,
                        }) as A;

                        await account.migrate?.(creationProps);
                    },
                });

                // TODO: figure out a way to not "waste" the first SessionID

                return {
                    account: AccountSchema.fromNode(node),
                    done: () => {
                        node.gracefulShutdown();
                    }
                };
            } catch (e) {
                auth.onError(new Error("Error creating account", { cause: e }));
            }
        }
    }
}
