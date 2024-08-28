import { Account, AuthMethod, AuthResult, ID } from "jazz-tools";
import type { LoadedClerk } from '@clerk/types';
import { AgentSecret } from "cojson";

export class BrowserClerkAuth implements AuthMethod {
    constructor(
        public driver: BrowserClerkAuth.Driver,
        private readonly clerkClient: LoadedClerk,
    ) {}

    async start(): Promise<AuthResult> {
        if (this.clerkClient.user) {
            const storedCredentials = this.clerkClient.user.unsafeMetadata;
            if (storedCredentials.jazzAccountID) {
                if (!storedCredentials.jazzAccountSecret) {
                    throw new Error("No secret for existing user");
                }
                return {
                    type: "existing",
                    credentials: {
                        accountID:
                            storedCredentials.jazzAccountID as ID<Account>,
                        secret: storedCredentials.jazzAccountSecret as AgentSecret,
                    },
                    onSuccess: () => {},
                    onError: (error: string | Error) => {
                        this.driver.onError(error);
                    },
                };
            } else {
                return {
                    type: "new",
                    creationProps: {
                        name:
                            this.clerkClient.user.fullName ||
                            this.clerkClient.user.username ||
                            this.clerkClient.user.id,
                    },
                    saveCredentials: async (credentials: {
                        accountID: ID<Account>;
                        secret: AgentSecret;
                    }) => {
                        await this.clerkClient.user?.update({
                            unsafeMetadata: {
                                jazzAccountID: credentials.accountID,
                                jazzAccountSecret: credentials.secret,
                            },
                        });
                    },
                    onSuccess: () => {},
                    onError: (error: string | Error) => {
                        this.driver.onError(error);
                    },
                };
            }
        } else {
            throw new Error("Not signed in");
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BrowserClerkAuth {
    export interface Driver {
        onError: (error: string | Error) => void;
    }
}
