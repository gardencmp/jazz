import { createContext, useContext } from "react";

export class AudioManager {
  mediaElement: HTMLAudioElement;

  audioObjectURL: string | null = null;

  constructor() {
    const mediaElement = new Audio();

    this.mediaElement = mediaElement;
  }

  async unloadCurrentAudio() {
    if (this.audioObjectURL) {
      URL.revokeObjectURL(this.audioObjectURL);
      this.audioObjectURL = null;
    }
  }

  async loadAudio(file: Blob) {
    await this.unloadCurrentAudio();

    const { mediaElement } = this;
    const audioObjectURL = URL.createObjectURL(file);

    this.audioObjectURL = audioObjectURL;

    mediaElement.src = audioObjectURL;
  }

  play() {
    if (this.mediaElement.ended) {
      this.mediaElement.fastSeek(0);
    }

    this.mediaElement.play();
  }

  pause() {
    this.mediaElement.pause();
  }

  destroy() {
    this.unloadCurrentAudio();
    this.mediaElement.pause();
  }
}

const context = createContext<AudioManager>(new AudioManager());

export function useAudioManager() {
  return useContext(context);
}

export const AudionManagerProvider = context.Provider;
