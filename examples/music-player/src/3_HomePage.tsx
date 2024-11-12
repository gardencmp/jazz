import { useToast } from "@/hooks/use-toast";
import { createInviteLink } from "jazz-react";
import { ID } from "jazz-tools";
import { useNavigate, useParams } from "react-router";
import { Playlist } from "./1_schema";
import { useAccount, useCoState } from "./2_main";
import { createNewPlaylist, uploadMusicTracks } from "./4_actions";
import { MediaPlayer } from "./5_useMediaPlayer";
import { FileUploadButton } from "./components/FileUploadButton";
import { LogoutButton } from "./components/LogoutButton";
import { MusicTrackRow } from "./components/MusicTrackRow";
import { PlaylistTitleInput } from "./components/PlaylistTitleInput";
import { SidePanel } from "./components/SidePanel";
import { Button } from "./components/ui/button";
import { usePlayState } from "./lib/audio/usePlayState";

export function HomePage({ mediaPlayer }: { mediaPlayer: MediaPlayer }) {
  /**
   * `me` represents the current user account, which will determine
   *  access rights to CoValues. We get it from the top-level provider `<WithJazz/>`.
   */
  const { me } = useAccount({
    root: {
      rootPlaylist: {},
      playlists: [],
    },
  });

  const navigate = useNavigate();
  const playState = usePlayState();
  const isPlaying = playState.value === "play";
  const { toast } = useToast();

  async function handleFileLoad(files: FileList) {
    if (!me) return;

    /**
     * Follow this function definition to see how we update
     * values in Jazz and manage files!
     */
    await uploadMusicTracks(me, files);
  }

  async function handleCreatePlaylist() {
    if (!me) return;

    const playlist = await createNewPlaylist(me);

    navigate(`/playlist/${playlist.id}`);
  }

  const params = useParams<{ playlistId: ID<Playlist> }>();
  const playlistId = params.playlistId ?? me?.root._refs.rootPlaylist.id;
  const playlist = useCoState(Playlist, playlistId, {
    tracks: [],
  });

  const isRootPlaylist = !params.playlistId;
  const isPlaylistOwner = playlist?._owner.myRole() === "admin";
  const isActivePlaylist = playlistId === me?.root.activePlaylist?.id;

  const handlePlaylistShareClick = async () => {
    if (!isPlaylistOwner) return;

    const inviteLink = createInviteLink(playlist, "reader");

    await navigator.clipboard.writeText(inviteLink);

    toast({
      title: "Invite link copied into the clipboard",
    });
  };

  return (
    <div className="flex flex-col h-screen text-gray-800 bg-blue-50">
      <div className="flex flex-1 overflow-hidden">
        <SidePanel />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            {isRootPlaylist ? (
              <h1 className="text-2xl font-bold text-blue-800">All tracks</h1>
            ) : (
              <PlaylistTitleInput playlistId={playlistId} />
            )}
            <div className="flex items-center space-x-4">
              {isRootPlaylist && (
                <>
                  <FileUploadButton onFileLoad={handleFileLoad}>
                    Add file
                  </FileUploadButton>
                  <Button onClick={handleCreatePlaylist}>New playlist</Button>
                </>
              )}
              {!isRootPlaylist && (
                <Button onClick={handlePlaylistShareClick}>
                  Share playlist
                </Button>
              )}
              <LogoutButton />
            </div>
          </div>
          <ul className="flex flex-col">
            {playlist?.tracks?.map(
              (track) =>
                track && (
                  <MusicTrackRow
                    trackId={track.id}
                    key={track.id}
                    isLoading={mediaPlayer.loading === track.id}
                    isPlaying={
                      mediaPlayer.activeTrackId === track.id &&
                      isActivePlaylist &&
                      isPlaying
                    }
                    onClick={() => {
                      mediaPlayer.setActiveTrack(track, playlist);
                    }}
                    showAddToPlaylist={isRootPlaylist}
                  />
                ),
            )}
          </ul>
        </main>
      </div>
    </div>
  );
}
