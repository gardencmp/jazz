import { MusicTrack } from "@/1_schema";
import { useCoState } from "@/2_main";
import { updateMusicTrackTitle } from "@/4_actions";
import { ID } from "jazz-tools";
import { ChangeEvent, useState } from "react";

export function MusicTrackTitleInput({
  trackId,
}: {
  trackId: ID<MusicTrack> | undefined;
}) {
  const track = useCoState(MusicTrack, trackId);
  const [isEditing, setIsEditing] = useState(false);
  const [localTrackTitle, setLocalTrackTitle] = useState("");

  function handleTitleChange(evt: ChangeEvent<HTMLInputElement>) {
    setLocalTrackTitle(evt.target.value);
  }

  function handleFoucsIn() {
    setIsEditing(true);
    setLocalTrackTitle(track?.title ?? "");
  }

  function handleFocusOut() {
    setIsEditing(false);
    setLocalTrackTitle("");
    track && updateMusicTrackTitle(track, localTrackTitle);
  }

  const inputValue = isEditing ? localTrackTitle : (track?.title ?? "");

  return (
    <div
      className="relative flex-grow"
      onClick={(evt) => evt.stopPropagation()}
    >
      <input
        className="absolute w-full h-full left-0 bg-transparent px-1"
        value={inputValue}
        onChange={handleTitleChange}
        spellCheck="false"
        onFocus={handleFoucsIn}
        onBlur={handleFocusOut}
        aria-label={`Edit track title: ${track?.title}`}
      />
      <span className="opacity-0 px-1 w-fit pointer-events-none whitespace-pre">
        {inputValue}
      </span>
    </div>
  );
}
