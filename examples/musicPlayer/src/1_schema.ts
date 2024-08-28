import {
    CoMap,
    CoList,
    BinaryCoStream,
    co,
    Profile,
    Account,
} from "jazz-tools";
import { getAudioFileData } from "./lib/audio/getAudioFileData";

/**
 * Hello!
 *
 * Welcome to the Jazz musicPlayer example! 🎶
 *
 * This is our first checkpoint the Schema definition.
 * In Jazz the schema is defined as code so you can control all you data model from here.
 *
 * By extending CoMap you can create your models and define schema migrations.
 */
export class MusicTrack extends CoMap {
    /**
     *  Attributes are defined as class properties
     *  and you can get the types from the `co` module
     *  here we are defining the title and duration for our music track
     *
     *  Tip: try to follow the co.string defintion to discover the other available primitives!
     */
    title = co.string;
    duration = co.number;

    /**
     * With `co.ref` you can define relations between your coValues.
     *
     * Attributes are required by default unless you mark them as optional.
     */
    sourceTrack = co.optional.ref(MusicTrack);

    /**
     * In Jazz you can files using BinaryCoStream.
     *
     * As for any other coValue the music files we put inside BinaryCoStream
     * is available offline and end-to-end encrypted 😉
     */
    file = co.ref(BinaryCoStream);
    waveform = co.ref(MusicTrackWaveform);
}

export class MusicTrackWaveform extends CoMap {
    data = co.json<number[]>();
}

/**
 * CoList is the collaborative version of Array
 *
 * They are strongly typed and accept only the type you define here
 * as "CoList.Of" argument
 */
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

/**
 * You can extend the Account type to link the user
 * to the data you want to be easily discoverable.
 *
 * Inside root for example we define the main list of tracks
 * we want to be visible from the hompage and the
 * list of playlists related to the user.
 */
export class MusicaAccount extends Account {
    profile = co.ref(Profile);
    root = co.ref(MusicaAccountRoot);

    /**
     * The migration function can also be used to fill the
     * initial data.
     *
     * It's a nice way to shape the inital structure of the account data
     * and add "onboarding" info.
     */
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
