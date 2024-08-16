import { useParams } from "react-router";
import { Playlist } from "./1_schema";
import { ID } from "jazz-tools";
import { useAccount, useCoState } from "./lib/jazz";
import { ChangeEvent } from "react";
import { MusicTrackRow } from "./components/MusicTrackRow";
import { useMediaPlayer } from "./3_useMediaPlayer";
import { usePlayState } from "./lib/audio/usePlayState";
import { addTrackToPlaylist } from "./4_actions";
import { Link } from "./basicComponents/Link";
import { Button } from "./basicComponents/Button";
import { createInviteLink } from "jazz-react";

export function PlaylistPage() {
    const { playlistId } = useParams<{ playlistId: ID<Playlist> }>();
    const mediaPlayer = useMediaPlayer();

    const playlist = useCoState(Playlist, playlistId, {
        tracks: [{}],
    });

    const { me } = useAccount({
        root: {
            rootPlaylist: {
                tracks: [{}],
            },
        },
    });

    const playState = usePlayState();
    const isPlaying = playState.value === "play";

    const currentTracksIds = new Set(playlist?.tracks.map((track) => track.id));
    const tracksToAdd = me?.root.rootPlaylist.tracks.filter(
        (track) => !currentTracksIds.has(track.id),
    );

    if (!playlist) return null;

    const handlePlaylistTitleChange = (evt: ChangeEvent<HTMLInputElement>) => {
        playlist.title = evt.target.value;
    };

    const handlePlaylistShareClick = async () => {
        if (playlist._owner.myRole() !== "admin") return;

        const inviteLink = createInviteLink(playlist, "reader");

        await navigator.clipboard.writeText(inviteLink);

        alert(`Invite link copied into the clipboard`);
    };

    return (
        <>
            <div className="flex bg-gray-300">
                <Link to="/">Back</Link>

                <input
                    className="w-full bg-transparent p-1 m-3"
                    value={playlist.title}
                    onChange={handlePlaylistTitleChange}
                />

                <Button onClick={handlePlaylistShareClick}>Share</Button>
            </div>
            <ul className="flex flex-col px-1 py-6 gap-6">
                {playlist.tracks?.map(
                    (track) =>
                        track && (
                            <MusicTrackRow
                                track={track}
                                key={track.id}
                                isLoading={mediaPlayer.loading === track.id}
                                isPlaying={isPlaying}
                                isActive={
                                    mediaPlayer.activeTrack?.id === track.id
                                }
                                onClick={() => {
                                    mediaPlayer.setActiveTrack(track, playlist);
                                }}
                            />
                        ),
                )}
            </ul>

            <div>
                Add tracks to the playlist
                <ul className="flex flex-col px-1 py-6 gap-6">
                    {tracksToAdd?.map(
                        (track) =>
                            track && (
                                <MusicTrackRow
                                    track={track}
                                    key={track.id}
                                    isLoading={false}
                                    isPlaying={false}
                                    isActive={false}
                                    onClick={() =>
                                        addTrackToPlaylist(playlist, track)
                                    }
                                />
                            ),
                    )}
                </ul>
            </div>
        </>
    );
}
