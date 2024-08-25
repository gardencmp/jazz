import { ID } from "jazz-tools";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAcceptInvite, useAccount } from "./0_jazz";
import { Playlist } from "./1_schema";

export function InvitePage() {
    const navigate = useNavigate();

    const { me } = useAccount({
        root: {
            playlists: [],
        },
    });

    useAcceptInvite({
        invitedObjectSchema: Playlist,
        onAccept: useCallback(
            async (playlistId: ID<Playlist>) => {
                if (!me) return;

                const playlist = await Playlist.load(playlistId, me, {});

                if (playlist) me.root.playlists.push(playlist);

                navigate("/playlist/" + playlistId);
            },
            [navigate, me],
        ),
    });

    return <p>Accepting invite....</p>;
}
