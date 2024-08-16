import { getAudioFileData } from "@/lib/audio/getAudioFileData";
import { BinaryCoStream, Group } from "jazz-tools";
import {
    ListOfTracks,
    MusicaAccount,
    MusicTrack,
    MusicTrackWaveform,
    Playlist,
} from "./1_schema";

export async function uploadMusicTracks(
    account: MusicaAccount,
    files: FileList,
) {
    const rootPlaylistTracks = account.root?.rootPlaylist?.tracks;

    if (!rootPlaylistTracks) return;

    const ownership = {
        owner: account,
    };

    for (const file of files) {
        const data = await getAudioFileData(file);
        const binaryCoStream = await BinaryCoStream.createFromBlob(
            file,
            ownership,
        );
        const musicTrack = MusicTrack.create(
            {
                file: binaryCoStream,
                duration: data.duration,
                waveform: MusicTrackWaveform.create(
                    { data: data.waveform },
                    ownership,
                ),
                title: file.name,
            },
            ownership,
        );
        rootPlaylistTracks.push(musicTrack);
    }
}

export async function createNewPlaylist(account: MusicaAccount) {
    const playlistGroup = Group.create({ owner: account });

    const ownership = { owner: playlistGroup };

    const playlist = Playlist.create(
        {
            title: "New Playlist",
            tracks: ListOfTracks.create([], ownership),
        },
        ownership,
    );

    account.root?.playlists?.push(playlist);

    return playlist;
}

export async function addTrackToPlaylist(
    playlist: Playlist,
    track: MusicTrack,
) {
    playlist.tracks?.push(track);
}
