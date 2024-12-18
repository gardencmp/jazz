import { ID } from "jazz-tools";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Playlist } from "./1_schema";
import { useAcceptInvite, useAccount } from "./2_main";

export function InvitePage() {
  const navigate = useNavigate();

  const { me } = useAccount({
    resolve: { root: { playlists: true } },
  });

  useAcceptInvite({
    invitedObjectSchema: Playlist,
    onAccept: useCallback(
      async (playlistId: ID<Playlist>) => {
        if (!me) return;

        const playlist = await Playlist.load(playlistId, me, {});

        if (
          playlist &&
          !me.root.playlists.some((item) => playlist.id === item?.id)
        ) {
          me.root.playlists.push(playlist);
        }

        navigate("/playlist/" + playlistId);
      },
      [navigate, me],
    ),
  });

  return <p>Accepting invite....</p>;
}
