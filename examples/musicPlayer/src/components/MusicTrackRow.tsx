import { MusicTrack } from "@/1_schema";
import { cn } from "@/lib/utils";
import { ChangeEvent } from "react";

export function MusicTrackRow({
    track,
    isLoading,
    isPlaying,
    onClick,
}: {
    track: MusicTrack;
    isLoading: boolean;
    isPlaying: boolean;
    onClick: (track: MusicTrack) => void;
}) {
    function handleTrackTitleChange(evt: ChangeEvent<HTMLInputElement>) {
        track.title = evt.target.value;
    }

    return (
        <li
            className={
                "flex gap-1  hover:bg-slate-200 group py-2 px-2 cursor-pointer"
            }
            onClick={() => onClick(track)}
        >
            <button
                className={cn(
                    "flex items-center justify-center bg-transparent w-8 h-8 ",
                    !isPlaying && "group-hover:bg-slate-300 rounded-full",
                )}
                onClick={() => onClick(track)}
            >
                {isLoading ? (
                    <div className="animate-spin">߷</div>
                ) : isPlaying ? (
                    "⏸️"
                ) : (
                    "▶️"
                )}
            </button>
            <div className="relative" onClick={(evt) => evt.stopPropagation()}>
                <input
                    className="absolute w-full h-full left-0 bg-transparent px-1"
                    value={track.title}
                    onChange={handleTrackTitleChange}
                    spellCheck="false"
                />
                <span className="opacity-0 px-1 w-fit pointer-events-none whitespace-pre">
                    {track.title}
                </span>
            </div>
        </li>
    );
}
