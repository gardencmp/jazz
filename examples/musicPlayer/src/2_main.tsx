import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { useMediaPlayer } from "./3_useMediaPlayer";
import { uploadMusicTracks } from "./4_actions";
import { useMediaEndListener } from "./lib/audio/useMediaEndListener";
import { usePlayState } from "./lib/audio/usePlayState";
import { Jazz, useAccount } from "./lib/jazz";
import { FileUploadButton } from "./basicComponents/FileUploadButton";

function App() {
    const mediaPlayer = useMediaPlayer();
    const { me } = useAccount({
        root: {
            rootPlaylist: {
                tracks: [{}],
            },
        },
    });

    const playState = usePlayState();

    useMediaEndListener(() => {
        mediaPlayer.playNextTrack();
    });

    async function handleFileLoad(files: FileList) {
        if (!me) return;

        await uploadMusicTracks(me, files);
    }

    return (
        <>
            <FileUploadButton onFileLoad={handleFileLoad}>
                Add file
            </FileUploadButton>
            <ul>
                {mediaPlayer.tracks?.map(
                    (track) =>
                        track && (
                            <li key={track.id}>
                                {track.title}{" "}
                                {mediaPlayer.activeTrack?.id !== track.id ? (
                                    <button
                                        onClick={() => {
                                            mediaPlayer.setActiveTrack(track);
                                        }}
                                    >
                                        Play
                                    </button>
                                ) : null}
                            </li>
                        ),
                )}
            </ul>
            {mediaPlayer.activeTrack && (
                <button onClick={playState.toggle}>
                    {playState.value === "play" ? "Pause" : "Play"}
                </button>
            )}
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
