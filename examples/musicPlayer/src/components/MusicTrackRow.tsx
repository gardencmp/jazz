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
        <li className={"flex gap-1  hover:bg-slate-200 group py-2 px-2"}>
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
            <input
                className="w-full bg-transparent px-1"
                value={track.title}
                onChange={handleTrackTitleChange}
            />
        </li>
    );
}
