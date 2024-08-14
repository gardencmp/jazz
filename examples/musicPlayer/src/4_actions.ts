import { getAudioFileData } from "@/lib/audio/getAudioFileData";
import { BinaryCoStream } from "jazz-tools";
import { MusicaAccount, MusicTrack, MusicTrackWaveform } from "./1_schema";

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
