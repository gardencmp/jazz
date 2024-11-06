import {
  Account,
  BinaryCoStream,
  CoList,
  CoMap,
  Profile,
  co,
} from "jazz-tools";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of tasks, lists of tasks and projects
 *  using CoJSON's collaborative map and list types, CoMap & CoList.
 *
 *  CoMap values and CoLists items can contain:
 *  - arbitrary immutable JSON
 *  - other CoValues
 **/

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

/** The account root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export class MusicaAccountRoot extends CoMap {
  // The root playlist works as container for the tracks that
  // the user has uploaded
  rootPlaylist = co.ref(Playlist);
  // Here we store the list of playlists that the user has created
  // or that has been invited to
  playlists = co.ref(ListOfPlaylists);
  // We store the active track and playlist as coValue here
  // so when the user reloads the page can see the last played
  // track and playlist
  // You can also add the position in time if you want make it possible
  // to resume the song
  activeTrack = co.optional.ref(MusicTrack);
  activePlaylist = co.ref(Playlist);

  exampleDataLoaded = co.optional.boolean;
}

export class MusicaAccount extends Account {
  profile = co.ref(Profile);
  root = co.ref(MusicaAccountRoot);

  /**
   *  The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  async migrate(creationProps?: { name: string }) {
    super.migrate(creationProps);

    if (!this._refs.root) {
      const ownership = { owner: this };

      const tracks = ListOfTracks.create([], ownership);
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
          activeTrack: null,
          activePlaylist: rootPlaylist,
          exampleDataLoaded: false,
        },
        ownership,
      );
    }
  }
}

/** Walkthrough: Continue with ./2_main.tsx */
