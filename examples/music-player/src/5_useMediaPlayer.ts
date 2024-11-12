import { MusicTrack, Playlist } from "@/1_schema";
import { usePlayMedia } from "@/lib/audio/usePlayMedia";
import { usePlayState } from "@/lib/audio/usePlayState";
import { BinaryCoStream, ID } from "jazz-tools";
import { useRef, useState } from "react";
import { useAccount } from "./2_main";
import { updateActivePlaylist, updateActiveTrack } from "./4_actions";
import { getNextTrack, getPrevTrack } from "./lib/getters";

export function useMediaPlayer() {
  const { me } = useAccount();

  const playState = usePlayState();
  const playMedia = usePlayMedia();

  const [loading, setLoading] = useState<ID<MusicTrack> | null>(null);

  const activeTrackId = me?.root?._refs.activeTrack?.id;

  // Reference used to avoid out-of-order track loads
  const lastLoadedTrackId = useRef<ID<MusicTrack> | null>(null);

  async function loadTrack(track: MusicTrack) {
    if (!me.root) return;

    lastLoadedTrackId.current = track.id;

    setLoading(track.id);

    const file = await BinaryCoStream.loadAsBlob(track._refs.file.id, me);

    if (!file) {
      setLoading(null);
      return;
    }

    // Check if another track has been loaded during
    // the file download
    if (lastLoadedTrackId.current !== track.id) {
      return;
    }

    updateActiveTrack(track, me);

    await playMedia(file);

    setLoading(null);
  }

  async function playNextTrack() {
    if (!me?.root) return;

    const track = await getNextTrack(me);

    if (track) {
      updateActiveTrack(track, me);
      await loadTrack(track);
    }
  }

  async function playPrevTrack() {
    if (!me?.root) return;

    const track = await getPrevTrack(me);

    if (track) {
      await loadTrack(track);
    }
  }

  async function setActiveTrack(track: MusicTrack, playlist?: Playlist) {
    if (!me?.root) return;

    if (activeTrackId === track.id && lastLoadedTrackId.current !== null) {
      playState.toggle();
      return;
    }

    updateActivePlaylist(playlist!, me);

    await loadTrack(track);

    if (playState.value === "pause") {
      playState.toggle();
    }
  }

  return {
    activeTrackId,
    setActiveTrack,
    playNextTrack,
    playPrevTrack,
    loading,
  };
}

export type MediaPlayer = ReturnType<typeof useMediaPlayer>;
