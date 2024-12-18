import { MusicTrack, Playlist } from "@/1_schema";
import { useAccount, useCoState } from "@/2_main";
import { addTrackToPlaylist } from "@/4_actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ID } from "jazz-tools";
import { MoreHorizontal } from "lucide-react";
import { MusicTrackTitleInput } from "./MusicTrackTitleInput";
import { Button } from "./ui/button";

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

  const { me } = useAccount({
    resolve: { root: { playlists: { $each: true } } },
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
        aria-label={`${isPlaying ? "Pause" : "Play"} ${track?.title}`}
      >
        {isLoading ? (
          <div className="animate-spin">߷</div>
        ) : isPlaying ? (
          "⏸️"
        ) : (
          "▶️"
        )}
      </button>
      <MusicTrackTitleInput trackId={trackId} />
      <div onClick={(evt) => evt.stopPropagation()}>
        {showAddToPlaylist && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label={`Open ${track?.title} menu`}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {playlists.map((playlist, index) => (
                <DropdownMenuItem
                  key={index}
                  onSelect={() => handleAddToPlaylist(playlist)}
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
