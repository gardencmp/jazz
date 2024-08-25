import { MediaPlayer } from "@/3_useMediaPlayer";
import { usePlayState } from "@/lib/audio/usePlayState";
import { Waveform } from "./Waveform";
import { useAccount } from "@/2_main";
import { useMediaEndListener } from "@/lib/audio/useMediaEndListener";
import { useKeyboardListener } from "@/lib/useKeyboardListener";

export function PlayerControls({ mediaPlayer }: { mediaPlayer: MediaPlayer }) {
    const playState = usePlayState();
    const isPlaying = playState.value === "play";

    const activePlaylist = useAccount({
        root: {
            activePlaylist: {},
        },
    }).me?.root.activePlaylist;

    useMediaEndListener(mediaPlayer.playNextTrack);
    useKeyboardListener("Space", () => {
        if (document.activeElement !== document.body) return;

        playState.toggle();
    });

    if (!mediaPlayer.activeTrack) return null;

    const activeTrackTitle = mediaPlayer.activeTrack.title;

    const head = activePlaylist?.title
        ? `${activePlaylist.title} / ${activeTrackTitle}`
        : activeTrackTitle;

    return (
        <div className=" flex flex-col fixed bottom-0 left-0 border-t-2 w-full p-4 gap-3">
            <div>Playling: {head}</div>
            <div className="flex items-center w-full">
                <div className="flex flex-shrink gap-3 text-xl">
                    {" "}
                    <button onClick={mediaPlayer.playPrevTrack}>⏮️</button>
                    {mediaPlayer.loading ? (
                        <div className="animate-spin">߷</div>
                    ) : !isPlaying ? (
                        <button onClick={playState.toggle}>▶️</button>
                    ) : (
                        <button onClick={playState.toggle}>⏸️</button>
                    )}
                    <button onClick={mediaPlayer.playNextTrack}>⏭️</button>
                </div>
                <Waveform track={mediaPlayer.activeTrack} height={30} />
            </div>
        </div>
    );
}
