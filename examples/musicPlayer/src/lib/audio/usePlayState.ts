import { useLayoutEffect, useState } from "react";
import { useAudioManager } from "./AudioManager";

export type PlayState = "pause" | "play";

export function usePlayState() {
	const audioManager = useAudioManager();
	const [value, setValue] = useState<PlayState>("pause");

	useLayoutEffect(() => {
		setValue(audioManager.mediaElement.paused ? "pause" : "play");

		const onPlay = () => {
			setValue("play");
		};

		const onPause = () => {
			setValue("pause");
		};

		audioManager.mediaElement.addEventListener("play", onPlay);
		audioManager.mediaElement.addEventListener("pause", onPause);

		return () => {
			audioManager.mediaElement.removeEventListener("play", onPlay);
			audioManager.mediaElement.removeEventListener("pause", onPause);
		};
	}, [audioManager]);

	function togglePlayState() {
		if (value === "pause") {
			audioManager.play();
		} else {
			audioManager.pause();
		}
	}

	return { value, toggle: togglePlayState };
}
