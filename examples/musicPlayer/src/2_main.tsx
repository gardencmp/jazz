import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { useMediaPlayer } from "./4_useMediaPlayer";
import { HomePage } from "./5_HomePage";
import { createNewPlaylist, uploadMusicTracks } from "./3_actions";
import { PlaylistPage } from "./6_PlaylistPage";
import { InvitePage } from "./7_InvitePage";
import { Button } from "./basicComponents/Button";
import { FileUploadButton } from "./basicComponents/FileUploadButton";
import { PlayerControls } from "./components/PlayerControls";
import "./index.css";

import { MusicaAccount } from "@/1_schema";
import { createJazzReactApp, DemoAuthBasicUI, useDemoAuth } from "jazz-react";
import { useUploadExampleData } from "./lib/useUploadExampleData";

/**
 * Walkthrough: The top-level provider `<Jazz.Provider/>`
 *
 * This shows how to use the top-level provider `<Jazz.Provider/>`,
 * which provides the rest of the app with a controlled account (used through `useAccount` later).
 * Here we use `DemoAuth` which is great for prototyping you app without wasting time on figuring out
 * the best way to do auth.
 *
 * `<Jazz.Provider/>` also runs our account migration
 */
const Jazz = createJazzReactApp({
    AccountSchema: MusicaAccount
});

export const { useAccount, useCoState, useAcceptInvite } = Jazz;

function Main() {
    const mediaPlayer = useMediaPlayer();

    useUploadExampleData();

    /**
     * `me` represents the current user account, which will determine
     *  access rights to CoValues. We get it from the top-level provider `<WithJazz/>`.
     */
    const { me } = useAccount();

    async function handleFileLoad(files: FileList) {
        if (!me) return;

        /**
         * Follow this function definition to see how we update
         * values in Jazz and manage files!
         */
        /** Walkthrough: Continue with ./3_actions.ts */
        await uploadMusicTracks(me, files);
    }

    async function handleCreatePlaylist() {
        if (!me) return;

        const playlist = await createNewPlaylist(me);

        router.navigate(`/playlist/${playlist.id}`);
    }

    const router = createHashRouter([
        {
            path: "/",
            element: <HomePage mediaPlayer={mediaPlayer} />,
        },
        {
            path: "/playlist/:playlistId",
            element: <PlaylistPage mediaPlayer={mediaPlayer} />,
        },
        {
            path: "/invite/*",
            element: <InvitePage />,
        },
    ]);

    return (
        <>
            <div className="flex items-center bg-gray-300">
                <img src="jazz-logo.png" className="px-3 h-[20px]" />
                <div className="text-nowrap">Jazz music player</div>
                <div className="flex w-full gap-1 justify-end">
                    <FileUploadButton onFileLoad={handleFileLoad}>
                        Add file
                    </FileUploadButton>
                    <Button onClick={handleCreatePlaylist}>
                        Create new playlist
                    </Button>
                </div>
            </div>
            <RouterProvider router={router} />
            <PlayerControls mediaPlayer={mediaPlayer} />
        </>
    );
}

function AuthAndJazz({ children }: { children: React.ReactNode }) {
    const [auth, state] = useDemoAuth();

    return (
        <Jazz.Provider auth={auth} peer="wss://mesh.jazz.tools/?key=music-player-example-jazz@gcmp.io">
            {state.state === "signedIn" ? children : <DemoAuthBasicUI appName="Jazz Music Player" state={state} />}
        </Jazz.Provider>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AuthAndJazz>
            <Main />
        </AuthAndJazz>
    </React.StrictMode>,
);
