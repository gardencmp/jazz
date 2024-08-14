import { Account, BinaryCoStream } from "jazz-tools";
import { MusicaAccount, MusicTrack } from "./1_schema";

export async function getNextTrack(account: MusicaAccount) {
    if (!account.root?.activePlaylist?.tracks) return;

    const tracks = account.root.activePlaylist.tracks;
    const activeTrack = account.root._refs.activeTrack;

    const currentIndex = tracks.findIndex(
        (item) => item?.id === activeTrack.id,
    );

    const nextIndex = (currentIndex + 1) % tracks.length;

    return tracks[nextIndex];
}

export async function getPrevTrack(account: MusicaAccount) {
    if (!account.root?.activePlaylist?.tracks) return;

    const tracks = account.root.activePlaylist.tracks;
    const activeTrack = account.root._refs.activeTrack;

    const currentIndex = tracks.findIndex(
        (item) => item?.id === activeTrack.id,
    );

    const previousIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    return tracks[previousIndex];
}

export async function loadMusicFileAsBlob(track: MusicTrack, account: Account) {
    let blob: Blob | undefined = undefined;

    while (!blob) {
        blob = await BinaryCoStream.loadAsBlob(track._refs.file.id, account);

        await new Promise((resolve) => setTimeout(resolve, 150));
    }

    return blob;
}
