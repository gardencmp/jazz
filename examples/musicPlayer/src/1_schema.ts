import {
    CoMap,
    CoList,
    BinaryCoStream,
    co,
    Profile,
    Account,
} from "jazz-tools";
import { getAudioFileData } from "./lib/audio/getAudioFileData";

export class MusicTrackWaveform extends CoMap {
    data = co.json<number[]>();
}

export class MusicTrack extends CoMap {
    file = co.ref(BinaryCoStream);
    title = co.string;
    duration = co.number;

    // Using a separate CoMap to lazy load this value
    waveform = co.ref(MusicTrackWaveform);
    sourceTrack = co.optional.ref(MusicTrack);

    migrate() {
        if (Array.isArray(this.waveform)) {
            this.waveform = MusicTrackWaveform.create(
                {
                    data: this.waveform,
                },
                { owner: this._owner },
            );
        }
    }
}

export class ListOfTracks extends CoList.Of(co.ref(MusicTrack)) {}

export class Playlist extends CoMap {
    title = co.string;
    tracks = co.ref(ListOfTracks);
}

export class ListOfPlaylists extends CoList.Of(co.ref(Playlist)) {}

export class MusicaAccountRoot extends CoMap {
    rootPlaylist = co.ref(Playlist);
    playlists = co.ref(ListOfPlaylists);
    activeTrack = co.optional.ref(MusicTrack);
    activePlaylist = co.ref(Playlist);
}

export class MusicaAccount extends Account {
    profile = co.ref(Profile);
    root = co.ref(MusicaAccountRoot);

    async migrate(creationProps?: { name: string }) {
        super.migrate(creationProps);
        if (!this._refs.root) {
            const ownership = { owner: this };

            const trackFile = await (await fetch("/example.mp3")).blob();
            const data = await getAudioFileData(trackFile);

            const initialMusicTrack = MusicTrack.create(
                {
                    file: await BinaryCoStream.createFromBlob(
                        trackFile,
                        ownership,
                    ),
                    duration: data.duration,
                    waveform: MusicTrackWaveform.create(
                        { data: data.waveform },
                        ownership,
                    ),
                    title: "Example audio",
                },
                ownership,
            );

            const tracks = ListOfTracks.create([initialMusicTrack], ownership);
            const rootPlaylist = Playlist.create(
                {
                    tracks,
                    title: "",
                },
                ownership,
            );

            this.root = MusicaAccountRoot.create(
                {
                    rootPlaylist,
                    playlists: ListOfPlaylists.create([], ownership),
                    activeTrack: initialMusicTrack,
                    activePlaylist: rootPlaylist,
                },
                ownership,
            );
        }
    }
}
