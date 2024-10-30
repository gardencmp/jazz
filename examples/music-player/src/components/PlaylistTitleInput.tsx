import { Playlist } from "@/1_schema";
import { useCoState } from "@/2_main";
import {
    updatePlaylistTitle
} from "@/4_actions";
import { ID } from "jazz-tools";
import { ChangeEvent, useState } from "react";

export function PlaylistTitleInput({
    playlistId,
}: {
    playlistId: ID<Playlist> | undefined;
}) {
    const playlist = useCoState(Playlist, playlistId);
    const [isEditing, setIsEditing] = useState(false);
    const [localPlaylistTitle, setLocalPlaylistTitle] = useState("");

    function handleTitleChange(evt: ChangeEvent<HTMLInputElement>) {
        setLocalPlaylistTitle(evt.target.value);
    }

    function handleFoucsIn() {
        setIsEditing(true);
        setLocalPlaylistTitle(playlist?.title ?? "");
    }

    function handleFocusOut() {
        setIsEditing(false);
        setLocalPlaylistTitle("");
        playlist && updatePlaylistTitle(playlist, localPlaylistTitle);
    }

    const inputValue = isEditing ? localPlaylistTitle : playlist?.title ?? "";

    return (
        <input
            value={inputValue}
            onChange={handleTitleChange}
            className="text-2xl font-bold text-blue-800 bg-transparent"
            onFocus={handleFoucsIn}
            onBlur={handleFocusOut}
            aria-label={`Playlist title`}
        />
    );
}
