import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { useMediaPlayer } from "./3_useMediaPlayer";
import { uploadMusicTracks } from "./4_actions";
import { useMediaEndListener } from "./lib/audio/useMediaEndListener";
import { usePlayState } from "./lib/audio/usePlayState";
import { Jazz, useAccount } from "./lib/jazz";
import { FileUploadButton } from "./basicComponents/FileUploadButton";
import { MusicTrackRow } from "./components/MusicTrackRow";

function App() {
    const mediaPlayer = useMediaPlayer();
    const { me } = useAccount({
        root: {
            rootPlaylist: {
                tracks: [{}],
            },
        },
    });

    const tracks = me?.root.rootPlaylist.tracks;

    const playState = usePlayState();

    useMediaEndListener(() => {
        mediaPlayer.playNextTrack();
    });

    async function handleFileLoad(files: FileList) {
        if (!me) return;

        await uploadMusicTracks(me, files);
    }

    const isPlaying = playState.value === "play";

    return (
        <>
            <FileUploadButton onFileLoad={handleFileLoad}>
                Add file
            </FileUploadButton>
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

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Jazz.Provider>
            <App />
        </Jazz.Provider>
    </React.StrictMode>,
);
