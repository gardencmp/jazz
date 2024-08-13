import { usePlayMedia } from "@/lib/audio/usePlayMedia";
import { usePlayState } from "@/lib/audio/usePlayState";
import { useAccount, useCoState } from "@/lib/jazz";
import { MusicTrack, Playlist } from "@/1_schema";
import { BinaryCoStream } from "jazz-tools";
import { useEffect } from "react";

export function useMediaPlayer() {
    const { me } = useAccount();

    const activeTrack = useCoState(MusicTrack, me?.root?.activeTrack?.id, {
        file: [],
    });
    const tracks = useCoState(Playlist, me?.root?.activePlaylist?.id, {
        tracks: [{}],
    })?.tracks;

    function getNextTrack() {
        if (!activeTrack) return;
        if (!tracks) return;

        const currentIndex = tracks.findIndex(
            (item) => item?.id === activeTrack.id,
        );
        const nextIndex = (currentIndex + 1) % tracks.length;

        return tracks[nextIndex];
    }

    function getPrevTrack() {
        if (!activeTrack) return;
        if (!tracks) return;

        const currentIndex = tracks.findIndex(
            (item) => item?.id === activeTrack.id,
        );

        const previousIndex =
            (currentIndex - 1 + tracks.length) % tracks.length;
        return tracks[previousIndex];
    }

    const playState = usePlayState();
    const playMedia = usePlayMedia();

    useEffect(() => {
        if (!activeTrack) return;
        if (playState.value !== "play") return;

        // TODO: Handle out of order requests
        async function play() {
            if (!activeTrack || !activeTrack.file) return;

            const file = await BinaryCoStream.loadAsBlob(
                activeTrack.file.id,
                me,
            );

            if (file) {
                await playMedia(file);
            }
        }

        play();
        // This effect load the song blob into the music player
        // Needs to be triggered only when the active track or the play state changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTrack?.id, playState.value]);

    function playNextTrack() {
        if (!me?.root) return;

        const next = getNextTrack();

        if (next) {
            me.root.activeTrack = next;
        }
    }

    function playPrevTrack() {
        if (!me?.root) return;

        const prev = getPrevTrack();

        if (prev) {
            me.root.activeTrack = prev;
        }
    }

    function setActiveTrack(track: MusicTrack, playlist?: Playlist) {
        if (!me?.root) return;

        me.root.activeTrack = track;
        me.root.activePlaylist = playlist ?? me.root.rootPlaylist;

        if (playState.value === "pause") {
            playState.toggle();
        }
    }

    return {
        tracks,
        activeTrack,
        setActiveTrack,
        playNextTrack,
        playPrevTrack,
    };
}
