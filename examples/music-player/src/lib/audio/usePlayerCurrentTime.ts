import { useLayoutEffect, useState } from "react";
import { useAudioManager } from "./AudioManager";

export function usePlayerCurrentTime() {
	const audioManager = useAudioManager();
	const [value, setValue] = useState<number>(0);

	useLayoutEffect(() => {
		setValue(audioManager.mediaElement.currentTime);

		const onTimeUpdate = () => {
			setValue(audioManager.mediaElement.currentTime);
		};

		audioManager.mediaElement.addEventListener("timeupdate", onTimeUpdate);

		return () => {
			audioManager.mediaElement.removeEventListener("timeupdate", onTimeUpdate);
		};
	}, [audioManager]);

	function setCurrentTime(time: number) {
		if (audioManager.mediaElement.paused) audioManager.play();

		audioManager.mediaElement.currentTime = time;
	}

	return {
		value,
		setValue: setCurrentTime,
	};
}
