import { MusicTrack } from "@/1_schema";
import { useAccount, useCoState } from "@/2_main";
import { MediaPlayer } from "@/5_useMediaPlayer";
import { useMediaEndListener } from "@/lib/audio/useMediaEndListener";
import { usePlayState } from "@/lib/audio/usePlayState";
import { useKeyboardListener } from "@/lib/useKeyboardListener";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Waveform } from "./Waveform";

export function PlayerControls({ mediaPlayer }: { mediaPlayer: MediaPlayer }) {
  const playState = usePlayState();
  const isPlaying = playState.value === "play";

  const activePlaylist = useAccount({
    resolve: {
      root: {
        activePlaylist: true,
      },
    },
  }).me?.root.activePlaylist;

  useMediaEndListener(mediaPlayer.playNextTrack);
  useKeyboardListener("Space", () => {
    if (document.activeElement !== document.body) return;

    playState.toggle();
  });

  const activeTrack = useCoState(MusicTrack, mediaPlayer.activeTrackId, {
    resolve: {
      waveform: true,
    },
  });

  if (!activeTrack) return null;

  const activeTrackTitle = activeTrack.title;

  return (
    <footer className="flex items-center justify-between p-4 gap-4 bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 w-full">
      <div className="flex justify-center items-center space-x-2">
        <div className="flex items-center space-x-4">
          <button
            onClick={mediaPlayer.playPrevTrack}
            className="text-blue-600 hover:text-blue-800"
            aria-label="Previous track"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={playState.toggle}
            className="w-[42px] h-[42px] flex items-center justify-center bg-blue-600 rounded-full text-white hover:bg-blue-700"
            aria-label={isPlaying ? "Pause active track" : "Play active track"}
          >
            {isPlaying ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" />
            )}
          </button>
          <button
            onClick={mediaPlayer.playNextTrack}
            className="text-blue-600 hover:text-blue-800"
            aria-label="Next track"
          >
            <SkipForward size={20} />
          </button>
        </div>
      </div>
      <div className=" sm:hidden md:flex flex-col flex-shrink-1 items-center w-[75%]">
        <Waveform track={activeTrack} height={30} />
      </div>
      <div className="flex flex-col items-end  gap-1 text-right min-w-fit w-[25%]">
        <h4 className="font-medium text-blue-800">{activeTrackTitle}</h4>
        <p className="text-sm text-gray-600">
          {activePlaylist?.title || "All tracks"}
        </p>
      </div>
    </footer>
  );
}
