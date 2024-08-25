import { useAccount, useCoState } from "@/0_jazz";
import { Playlist, MusicTrack, ListOfTracks } from "@/1_schema";
import { cn } from "@/lib/utils";

export function AddTracksToPlaylistSection({
    playlist,
    onTrackClick,
}: {
    playlist: Playlist;
    onTrackClick: (track: MusicTrack) => void;
}) {
    const { me } = useAccount({
        root: {
            rootPlaylist: {
                tracks: [{}],
            },
        },
    });

    const listOfTracks = useCoState(ListOfTracks, playlist._refs.tracks.id, []);

    const currentTracksIds = new Set(
        listOfTracks?.map((track) => track?._refs.sourceTrack?.id),
    );
    const tracksToAdd = me?.root.rootPlaylist.tracks.filter(
        (track) => !currentTracksIds.has(track.id),
    );

    if (!tracksToAdd?.length) return null;

    return (
        <div>
            Add tracks to the playlist
            <ul className="flex flex-col px-1 py-6 gap-6">
                {tracksToAdd.map((track) => (
                    <li
                        key={track.id}
                        className={cn("flex gap-6  p-3 bg-slate-200")}
                    >
                        <div className="w-6 flex justify-center">
                            <button onClick={() => onTrackClick(track)}>
                                +
                            </button>
                        </div>
                        {track.title}
                    </li>
                ))}
            </ul>
        </div>
    );
}
