import { createInviteLink } from "jazz-react";
import { ID } from "jazz-tools";
import { ChangeEvent } from "react";
import { useParams } from "react-router";
import { useAccount, useCoState } from "./0_jazz";
import { Playlist } from "./1_schema";
import { useMediaPlayer } from "./3_useMediaPlayer";
import { addTrackToPlaylist } from "./4_actions";
import { Button } from "./basicComponents/Button";
import { Link } from "./basicComponents/Link";
import { MusicTrackRow } from "./components/MusicTrackRow";
import { usePlayState } from "./lib/audio/usePlayState";
import { AddTracksToPlaylistSection } from "./components/AddTracksToPlaylistSection";

export function PlaylistPage() {
    const { playlistId } = useParams<{ playlistId: ID<Playlist> }>();
    const mediaPlayer = useMediaPlayer();

    const playlist = useCoState(Playlist, playlistId, {
        tracks: [{}],
    });

    const { me } = useAccount();

    const playState = usePlayState();
    const isPlaying = playState.value === "play";

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

            <AddTracksToPlaylistSection
                playlist={playlist}
                onTrackClick={(track) =>
                    addTrackToPlaylist(playlist, track, me)
                }
            />
        </>
    );
}
