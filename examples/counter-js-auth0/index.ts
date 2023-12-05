import * as auth0 from "@auth0/auth0-spa-js";
import {
    Account,
    CoID,
    CoList,
    CoMap,
    Profile,
} from "cojson";
import { ResolvedAccount, autoSub, autoSubResolution, createBrowserNode } from "jazz-browser";
import { BrowserAuth0 } from "jazz-browser-auth0";

const auth0options = {
    domain: "dev-12uyj8w4t4yjzkwa.us.auth0.com",
    clientId: "TcYtq9an3PDyInQJvD1k8PtqupYG4PnA",
};

window.onload = async () => {
    const auth0Client = await auth0.createAuth0Client(auth0options);

    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {
        await auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, "/");
    } else {
        document
            .getElementById("login")
            ?.addEventListener("click", async () => {
                await auth0Client.loginWithRedirect({
                    authorizationParams: {
                        redirect_uri: window.location.origin,
                        audience: `https://${auth0options.domain}/api/v2/`,
                        scope: "read:current_user update:current_user_metadata",
                    },
                });
            });
    }

    if (!await auth0Client.isAuthenticated()) {
        return;
    }


    let accessToken: string | undefined;
    try {
        accessToken = await auth0Client.getTokenSilently();
    } catch (e) {
        alert("Failed to get access token silently, creating popup - this should only happen on localhost. Otherwise, check that allowed callback URLs are set correctly.")
        accessToken = await auth0Client.getTokenWithPopup({
            authorizationParams: {
                redirect_uri: window.location.origin,
                audience: `https://${auth0options.domain}/api/v2/`,
                scope: "read:current_user update:current_user_metadata",
            }
        });
    }

    if (!accessToken) {
        throw new Error("No access token");
    }

    const { node, done } = await createBrowserNode({
        auth: new BrowserAuth0(
            {
                domain: auth0options.domain,
                clientID: auth0options.clientId,
                accessToken,
            },
            auth0options.domain,
            "jazz-browser-auth0-example"
        ),
        migration: (account) => {
            if (!account.get("root")) {
                account.set(
                    "root",
                    account.createMap({
                        countIncrements: account.createList([]).id,
                    }).id
                );
            }
        },
    });

    autoSub<Account<Profile, CoMap<{ countIncrements: CoID<CoList<number>> }>>>(
        "me",
        node,
        (me) => {
            if (me?.root?.countIncrements) {
                document.getElementById("count")!.innerText =
                    me.root.countIncrements.reduce((sum, inc) => sum + inc, 0) +
                    "";
            }
        }
    );

    const increments = await autoSubResolution("me", (me: ResolvedAccount<Account<Profile, CoMap<{ countIncrements: CoID<CoList<number>> }>>>) => {
        return me?.root?.countIncrements;
    }, node)

    document.getElementById("increment")!.addEventListener("click", () => {
        increments.append(1);
    });
};
