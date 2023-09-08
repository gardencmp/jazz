import { useCallback } from "react";

import { useJazz } from "jazz-react";

import { PetPost } from "./1_types";

import { Button } from "./basicComponents";

import { useSimpleHashRouterThatAcceptsInvites } from "./router";
import { PetPostUI } from "./4_PetPostUI";
import { CreatePetPostForm } from "./4_CreatePetPostForm";

/** Walkthrough: Creating pet posts & routing in `<App/>`
 *
 *  <App> is the main app component, handling client-side routing based
 *  on the CoValue ID (CoID) of our PetPost, stored in the URL hash
 *  - which can also contain invite links.
 */

export default function App() {
    // A `LocalNode` represents a local view of loaded & created CoValues.
    // It is associated with a current user account, which will determine
    // access rights to CoValues. We get it from the top-level provider `<WithJazz/>`.
    const { localNode, logOut } = useJazz();

    // This sets up routing and accepting invites, skip for now
    const [currentPetPostID, navigateToPetPostID] =
        useSimpleHashRouterThatAcceptsInvites<PetPost>(localNode);

    return (
        <div className="flex flex-col h-full items-center justify-start gap-10 pt-10 pb-10 px-5">
            {currentPetPostID ? (
                <PetPostUI petPostID={currentPetPostID} />
            ) : (
                <CreatePetPostForm onCreate={navigateToPetPostID} />
            )}
            <Button
                onClick={() => {
                    navigateToPetPostID(undefined);
                    logOut();
                }}
                variant="outline"
            >
                Log Out
            </Button>
        </div>
    );
}

/** Walkthrough: continue with ./3_TodoTable.tsx */
