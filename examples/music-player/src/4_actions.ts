import { getAudioFileData } from "@/lib/audio/getAudioFileData";
import { FileStream, Group } from "jazz-tools";
import {
  ListOfTracks,
  MusicTrack,
  MusicTrackWaveform,
  MusicaAccount,
  Playlist,
} from "./1_schema";

/**
 * Walkthrough: Actions
 *
 * With Jazz is very simple to update the state, you
 * just mutate the values and we take care of triggering
 * the updates and sync  and persist the values you change.
 *
 * We have grouped the complex updates here in an actions file
 * just to keep them separated from the components.
 *
 * Jazz is very unopinionated in this sense and you can adopt the
 * pattern that best fits your app.
 */

export async function uploadMusicTracks(
  account: MusicaAccount,
  files: Iterable<File>,
) {
  // The ownership object defines the user that owns the created coValues
  // by setting the ownership with "account" we configure the coValues to be private
  const ownership = {
    owner: account,
  };

  for (const file of files) {
    const data = await getAudioFileData(file);

    // We transform the file blob into a FileStream
    // making it a collaborative value that is encrypted, easy
    // to share across devices and users and available offline!
    const fileStream = await FileStream.createFromBlob(file, ownership);

    const musicTrack = MusicTrack.create(
      {
        file: fileStream,
        duration: data.duration,
        waveform: MusicTrackWaveform.create({ data: data.waveform }, ownership),
        title: file.name,
      },
      ownership,
    );

    // The newly created musicTrack can be associated to the
    // user track list using a simple push call
    account.root?.rootPlaylist?.tracks?.push(musicTrack);
  }
}

export async function createNewPlaylist(account: MusicaAccount) {
  // Since playlists are meant to be shared we associate them
  // to a group which will contain the keys required to get
  // access to the "owned" values
  const playlistGroup = Group.create({ owner: account });

  const ownership = { owner: playlistGroup };

  const playlist = Playlist.create(
    {
      title: "New Playlist",
      tracks: ListOfTracks.create([], ownership),
    },
    ownership,
  );

  // Again, we associate the new playlist to the
  // user by pushing it into the playlists CoList
  account.root?.playlists?.push(playlist);

  return playlist;
}

export async function addTrackToPlaylist(
  playlist: Playlist,
  track: MusicTrack,
  account: MusicaAccount | undefined,
) {
  if (!account) return;

  if (playlist.tracks?.some((t) => t?._refs.sourceTrack.id === track.id))
    return;

  /**
   * Since musicTracks are created as private values (see uploadMusicTracks)
   * to make them shareable as part of the playlist we are cloning them
   * and setting the playlist group as owner of the clone
   *
   * In the future it will be possible to "inherit" the parent group so you
   * won't need to clone values to have this kind of sharing granularity
   */
  const ownership = { owner: playlist._owner };
  const blob = await FileStream.loadAsBlob(track._refs.file.id, account);
  const waveform = await MusicTrackWaveform.load(
    track._refs.waveform.id,
    account,
    {},
  );

  if (!blob || !waveform) return;

  const trackClone = MusicTrack.create(
    {
      file: await FileStream.createFromBlob(blob, ownership),
      duration: track.duration,
      waveform: MusicTrackWaveform.create({ data: waveform.data }, ownership),
      title: track.title,
      sourceTrack: track,
    },
    ownership,
  );

  playlist.tracks?.push(trackClone);
}

export async function updatePlaylistTitle(playlist: Playlist, title: string) {
  playlist.title = title;
}

export async function updateMusicTrackTitle(track: MusicTrack, title: string) {
  track.title = title;
}

export async function updateActivePlaylist(
  playlist: Playlist,
  me: MusicaAccount,
) {
  me.root!.activePlaylist = playlist ?? me.root!.rootPlaylist;
}

export async function updateActiveTrack(track: MusicTrack, me: MusicaAccount) {
  me.root!.activeTrack = track;
}
