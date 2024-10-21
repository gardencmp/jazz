import { MusicTrack, Playlist } from "@/1_schema";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { ChangeEvent } from "react";
import { Button } from "./ui/button";
import { useAccount, useCoState } from "@/2_main";
import { addTrackToPlaylist, updateMusicTrackTitle } from "@/4_actions";
import { ID } from "jazz-tools";

export function MusicTrackRow({
    trackId,
    isLoading,
    isPlaying,
    onClick,
    showAddToPlaylist,
}: {
    trackId: ID<MusicTrack>;
    isLoading: boolean;
    isPlaying: boolean;
    onClick: (track: MusicTrack) => void;
    showAddToPlaylist: boolean;
}) {
    const track = useCoState(MusicTrack, trackId);

    function handleTrackTitleChange(evt: ChangeEvent<HTMLInputElement>) {
        if (!track) return;

        updateMusicTrackTitle(track, evt.target.value);
    }

    const { me } = useAccount({
        root: {
            playlists: [{}],
        },
    });

    const playlists = me?.root.playlists ?? [];

    function handleTrackClick() {
        if (!track) return;
        onClick(track);
    }

    function handleAddToPlaylist(playlist: Playlist) {
        if (!track) return;
        addTrackToPlaylist(playlist, track, me);
    }

    return (
        <li
            className={
                "flex gap-1  hover:bg-slate-200 group py-2 px-2 cursor-pointer"
            }
            onClick={handleTrackClick}
        >
            <button
                className={cn(
                    "flex items-center justify-center bg-transparent w-8 h-8 ",
                    !isPlaying && "group-hover:bg-slate-300 rounded-full",
                )}
                onClick={handleTrackClick}
            >
                {isLoading ? (
                    <div className="animate-spin">߷</div>
                ) : isPlaying ? (
                    "⏸️"
                ) : (
                    "▶️"
                )}
            </button>
            <div
                className="relative flex-grow"
                onClick={(evt) => evt.stopPropagation()}
            >
                <input
                    className="absolute w-full h-full left-0 bg-transparent px-1"
                    value={track?.title}
                    onChange={handleTrackTitleChange}
                    spellCheck="false"
                />
                <span className="opacity-0 px-1 w-fit pointer-events-none whitespace-pre">
                    {track?.title}
                </span>
            </div>
            <div onClick={(evt) => evt.stopPropagation()}>
                {showAddToPlaylist && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {playlists.map((playlist, index) => (
                                <DropdownMenuItem
                                    key={index}
                                    onSelect={() =>
                                        handleAddToPlaylist(playlist)
                                    }
                                >
                                    Add to {playlist.title}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </li>
    );
}
