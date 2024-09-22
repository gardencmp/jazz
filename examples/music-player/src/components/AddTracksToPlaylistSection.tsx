import { useAccount, useCoState } from "@/2_main";
import { Playlist, MusicTrack, ListOfTracks } from "@/1_schema";
import { Button } from "@/basicComponents/Button";
import { useState } from "react";

export function AddTracksToPlaylistSection({
    playlist,
    onTrackClick,
}: {
    playlist: Playlist;
    onTrackClick: (track: MusicTrack) => Promise<void>;
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
                        className={"flex items-center gap-6 bg-slate-200"}
                    >
                        <AddTrackButton
                            track={track}
                            onTrackClick={onTrackClick}
                        />
                        {track.title}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function AddTrackButton({
    track,
    onTrackClick,
}: {
    track: MusicTrack;
    onTrackClick: (track: MusicTrack) => Promise<void>;
}) {
    const [isLoading, setLoading] = useState(false);

    async function handleClick() {
        if (isLoading) return;

        setLoading(true);

        try {
            await onTrackClick(track);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button className="py-2 px-4" onClick={handleClick}>
            {isLoading ? <div className="animate-spin">߷</div> : "+"}
        </Button>
    );
}
