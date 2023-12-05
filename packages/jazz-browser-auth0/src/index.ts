import {
    AccountID,
    AccountMigration,
    AgentSecret,
    LocalNode,
    Peer,
} from "cojson";
import { AuthProvider, SessionProvider } from "jazz-browser";
import { Auth0UserProfile, Authentication, Management } from "auth0-js";

type CredentialData = {
    accountID: AccountID;
    accountSecret: AgentSecret;
};

export class BrowserAuth0 implements AuthProvider {
    clientID: string;
    auth0domain: string;
    accessToken: string;

    appName: string;
    appHostname: string;

    /** Create or use Jazz account linked to an Auth0 account. The access token must have been retreived from a WebAuthn instance created with the following options:
     *
     * - `audience: https://{yourDomain}/api/v2/`
     * - `scope: "read:current_user update:current_user_metadata"`
     */
    constructor(
        auth0Options: {
            clientID: string;
            domain: string;
            accessToken: string;
        },
        appName: string,
        // TODO: is this a safe default?
        appHostname: string = window.location.hostname
    ) {
        this.clientID = auth0Options.clientID;
        this.auth0domain = auth0Options.domain;
        this.accessToken = auth0Options.accessToken;
        this.appName = appName;
        this.appHostname = appHostname;
    }

    async createNode(
        getSessionFor: SessionProvider,
        initialPeers: Peer[],
        migration?: AccountMigration
    ): Promise<LocalNode> {
        const auth0client = new Authentication({
            clientID: this.clientID,
            domain: this.auth0domain,
        });

        const user = await new Promise<Auth0UserProfile>((resolve, reject) => {
            auth0client.userInfo(this.accessToken, (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        });

        const management = new Management({
            token: this.accessToken,
            domain: this.auth0domain,
        });

        const metadata = await new Promise<Record<string, string>>(
            (resolve, reject) => {
                management.getUser(user.sub, (err, profile) => {
                    if (err) reject(err);
                    else resolve(profile.user_metadata);
                });
            }
        );

        const existingCredentialString = metadata?.["jazz_credential"];

        if (existingCredentialString) {
            const existingCredential = JSON.parse(
                existingCredentialString
            ) as CredentialData;

            return LocalNode.withLoadedAccount({
                accountID: existingCredential.accountID,
                accountSecret: existingCredential.accountSecret,
                sessionID: await getSessionFor(existingCredential.accountID),
                peersToLoadFrom: initialPeers,
                migration,
            });
        } else {


            const username =
                user.nickname || user.name || user.email || user.sub;

            const { node, accountID, accountSecret } =
                await LocalNode.withNewlyCreatedAccount({
                    name: username,
                    migration,
                    peersToLoadFrom: initialPeers,
                });

            await new Promise<void>((resolve, reject) =>
                management.patchUserMetadata(
                    user.sub,
                    {
                        jazz_credential: JSON.stringify({
                            accountID,
                            accountSecret,
                        } as CredentialData),
                    },
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                )
            );

            return node;
        }
    }
}
