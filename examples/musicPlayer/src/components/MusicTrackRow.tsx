import { MusicTrack } from "@/1_schema";
import { cn } from "@/lib/utils";
import { ChangeEvent } from "react";

export function MusicTrackRow({
    track,
    isLoading,
    isActive,
    isPlaying,
    onClick,
}: {
    track: MusicTrack;
    isLoading: boolean;
    isActive: boolean;
    isPlaying: boolean;
    onClick: (track: MusicTrack) => void;
}) {
    function handleTrackTitleChange(evt: ChangeEvent<HTMLInputElement>) {
        track.title = evt.target.value;
    }

    return (
        <li
            className={cn(
                "flex gap-6  p-3",
                isActive ? "bg-slate-400" : "bg-slate-200",
            )}
        >
            <div className="w-6 flex justify-center">
                {isLoading ? (
                    <div className="animate-spin">߷</div>
                ) : !isActive || !isPlaying ? (
                    <button onClick={() => onClick(track)}>▶️</button>
                ) : (
                    <button onClick={() => onClick(track)}>⏸️</button>
                )}
            </div>
            <input
                className="w-full bg-transparent"
                value={track.title}
                onChange={handleTrackTitleChange}
            />
        </li>
    );
}
