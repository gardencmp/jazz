import {
    CoMap,
    CoList,
    BinaryCoStream,
    co,
    Profile,
    Account,
} from "jazz-tools";

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

    migrate(creationProps?: { name: string }) {
        super.migrate(creationProps);
        if (!this._refs.root) {
            const ownership = { owner: this };

            const rootPlaylist = Playlist.create(
                {
                    tracks: ListOfTracks.create([], ownership),
                    title: "",
                },
                ownership,
            );

            this.root = MusicaAccountRoot.create(
                {
                    rootPlaylist,
                    playlists: ListOfPlaylists.create([], ownership),
                    activeTrack: null,
                    activePlaylist: rootPlaylist,
                },
                ownership,
            );
        }
    }
}
