import {
    CoMap,
    CoList,
    BinaryCoStream,
    co,
    Profile,
    Account,
  } from "jazz-tools";
  
  export class MusicTrack extends CoMap {
    file = co.ref(BinaryCoStream);
    title = co.string;
    duration = co.number;
    waveform = co.json<number[]>();
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
    activeTrack = co.ref(MusicTrack);
    activePlaylist = co.ref(Playlist);
  }
  
  export class MusicaAccount extends Account {
    profile = co.ref(Profile);
    root = co.ref(MusicaAccountRoot);
  
    migrate(this: MusicaAccount, creationProps?: { name: string }) {
      super.migrate(creationProps);
      if (!this._refs.root) {
        const rootPlaylist = Playlist.create(
          {
            tracks: ListOfTracks.create([], { owner: this }),
            title: "",
          },
          { owner: this }
        );
  
        this.root = MusicaAccountRoot.create(
          {
            rootPlaylist,
            playlists: ListOfPlaylists.create([], { owner: this }),
            activeTrack: null,
            activePlaylist: rootPlaylist,
          },
          { owner: this }
        );
      }
    }
  }
  