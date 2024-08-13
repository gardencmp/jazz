import { useEffect } from "react";
import { useAudioManager } from "./AudioManager";

export function useMediaEndListener(callback: () => void) {
	const audioManager = useAudioManager();

	useEffect(() => {
		audioManager.mediaElement.addEventListener("ended", callback);

		return () => {
			audioManager.mediaElement.removeEventListener("ended", callback);
		};
	}, [audioManager, callback]);
}
