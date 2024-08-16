import React, { useCallback } from "react";
import ReactDOM from "react-dom/client";
import {
    RouterProvider,
    createHashRouter,
    useNavigate,
} from "react-router-dom";
import "./index.css";
import { useMediaPlayer } from "./3_useMediaPlayer";
import { createNewPlaylist, uploadMusicTracks } from "./4_actions";
import { useMediaEndListener } from "./lib/audio/useMediaEndListener";
import { usePlayState } from "./lib/audio/usePlayState";
import { Jazz, useAcceptInvite, useAccount } from "./lib/jazz";
import { FileUploadButton } from "./basicComponents/FileUploadButton";
import { MusicTrackRow } from "./components/MusicTrackRow";
import { PlaylistPage } from "./6_PlaylistPage";
import { Button } from "./basicComponents/Button";
import { Link } from "./basicComponents/Link";
import { Playlist } from "./1_schema";
import { ID } from "jazz-tools";

function App() {
    const navigate = useNavigate();
    const mediaPlayer = useMediaPlayer();
    const { me } = useAccount({
        root: {
            rootPlaylist: {
                tracks: [{}],
            },
            playlists: [{}],
        },
    });

    const tracks = me?.root.rootPlaylist.tracks;

    const playState = usePlayState();
    const isPlaying = playState.value === "play";

    useMediaEndListener(() => {
        mediaPlayer.playNextTrack();
    });

    async function handleFileLoad(files: FileList) {
        if (!me) return;

        await uploadMusicTracks(me, files);
    }
    async function handleCreatePlaylist() {
        if (!me) return;

        const playlist = await createNewPlaylist(me);

        navigate(`/playlist/${playlist.id}`);
    }

    const playlists = me?.root.playlists;

    return (
        <>
            <div className="flex p-1 gap-3">
                <FileUploadButton onFileLoad={handleFileLoad}>
                    Add file
                </FileUploadButton>
                <Button onClick={handleCreatePlaylist}>
                    Create new playlist
                </Button>
            </div>
            {playlists && playlists.length > 0 && (
                <div>
                    <b>Playlists</b>
                    <div className="flex px-1 py-6 gap-6">
                        {playlists.map((playlist) => (
                            <Link to={`/playlist/${playlist.id}`}>
                                {playlist.title}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
            <ul className="flex flex-col px-1 py-6 gap-6">
                {tracks?.map(
                    (track) =>
                        track && (
                            <MusicTrackRow
                                track={track}
                                key={track.id}
                                isLoading={mediaPlayer.loading === track.id}
                                isPlaying={isPlaying}
                                isActive={
                                    mediaPlayer.activeTrack?.id === track.id
                                }
                                onClick={mediaPlayer.setActiveTrack}
                            />
                        ),
                )}
            </ul>
        </>
    );
}

function InvitePage() {
    const navigate = useNavigate();

    useAcceptInvite({
        invitedObjectSchema: Playlist,
        onAccept: useCallback(
            (playlistId: ID<Playlist>) => navigate("/playlist/" + playlistId),
            [navigate],
        ),
    });

    return <p>Accepting invite....</p>;
}

const router = createHashRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/playlist/:playlistId",
        element: <PlaylistPage />,
    },
    {
        path: "/invite/*",
        element: <InvitePage />,
    },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Jazz.Provider>
            <RouterProvider router={router} />
        </Jazz.Provider>
    </React.StrictMode>,
);
