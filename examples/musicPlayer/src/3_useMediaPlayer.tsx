import { usePlayMedia } from "@/lib/audio/usePlayMedia";
import { usePlayState } from "@/lib/audio/usePlayState";
import { useAccount, useCoState } from "@/lib/jazz";
import { MusicTrack, Playlist } from "@/1_schema";
import { useRef, useState } from "react";
import { getNextTrack, getPrevTrack, loadMusicFileAsBlob } from "./5_getters";
import { ID } from "jazz-tools";

export function useMediaPlayer() {
    const { me } = useAccount();

    const playState = usePlayState();
    const playMedia = usePlayMedia();

    const [loading, setLoading] = useState<ID<MusicTrack> | null>(null);

    const activeTrack = useCoState(MusicTrack, me?.root?._refs.activeTrack?.id);

    // Reference used to avoid out-of-order track loads
    const lastLoadedTrackId = useRef<ID<MusicTrack> | null>(null);

    async function loadTrack(track: MusicTrack) {
        if (!me.root) return;

        lastLoadedTrackId.current = track.id;

        setLoading(track.id);

        const file = await loadMusicFileAsBlob(track, me);

        // Check if another track has been loaded during
        // the file download
        if (lastLoadedTrackId.current !== track.id) {
            return;
        }

        me.root.activeTrack = track;

        await playMedia(file);

        setLoading(null);
    }

    async function playNextTrack() {
        if (!me?.root) return;

        const track = await getNextTrack(me);

        if (track) {
            me.root.activeTrack = track;
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

        if (
            activeTrack?.id === track.id &&
            lastLoadedTrackId.current !== null
        ) {
            playState.toggle();
            return;
        }

        me.root.activePlaylist = playlist ?? me.root.rootPlaylist;

        await loadTrack(track);

        if (playState.value === "pause") {
            playState.toggle();
        }
    }

    return {
        activeTrack,
        setActiveTrack,
        playNextTrack,
        playPrevTrack,
        loading,
    };
}
