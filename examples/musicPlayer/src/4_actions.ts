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
    account: MusicaAccount | undefined,
) {
    if (!account) return;

    const ownership = { owner: playlist._owner };
    const blob = await BinaryCoStream.loadAsBlob(track._refs.file.id, account);
    const waveform = await MusicTrackWaveform.load(
        track._refs.waveform.id,
        account,
        {},
    );

    if (!blob || !waveform) return;

    const trackClone = MusicTrack.create(
        {
            file: await BinaryCoStream.createFromBlob(blob, ownership),
            duration: track.duration,
            waveform: MusicTrackWaveform.create(
                { data: waveform.data },
                ownership,
            ),
            title: track.title,
            sourceTrack: track,
        },
        ownership,
    );

    playlist.tracks?.push(trackClone);
}
