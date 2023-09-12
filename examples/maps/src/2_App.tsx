import { useJazz } from "jazz-react";

import { MapNotes, MapSpace, Positions } from "./1_types";

import { Button, SubmittableInput } from "./basicComponents";

import { useSimpleHashRouterThatAcceptsInvites } from "./router";
import { MapView } from "./4_MapView";

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
    const [currentMapID, navigateToMapID] =
        useSimpleHashRouterThatAcceptsInvites<MapSpace>(localNode);

    return (
        <div className="flex flex-col h-full items-center justify-start gap-10 pt-10 pb-10 px-5">
            {currentMapID ? (
                <MapView mapID={currentMapID} />
            ) : (
                <SubmittableInput placeholder="New Map Space Name" label="Create new Map Space" onSubmit={name => {
                    const group = localNode.createGroup();
                    const mapSpace = group.createMap<MapSpace>();
                    const positions = group.createStream<Positions>();
                    const notes = group.createList<MapNotes>();

                    mapSpace.edit(mapSpace => {
                        mapSpace.set("name", name);
                        mapSpace.set("positions", positions.id);
                        mapSpace.set("notes", notes.id);
                    });

                    navigateToMapID(mapSpace.id);
                }}/>
            )}
            <Button
                onClick={() => {
                    navigateToMapID(undefined);
                    logOut();
                }}
                variant="outline"
            >
                Log Out
            </Button>
        </div>
    );
}

/** Walkthrough: continue with ./3_CreatePetPostForm.tsx */
