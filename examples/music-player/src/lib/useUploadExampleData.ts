// eslint-disable-next-line react-compiler/react-compiler
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { MusicaAccount } from "../1_schema";
import { useAccount } from "../2_main";
import { uploadMusicTracks } from "../4_actions";

export function useUploadExampleData() {
  const { me } = useAccount({
    resolve: { root: true },
  });

  const shouldUploadOnboardingData = me?.root?.exampleDataLoaded === false;

  useEffect(() => {
    if (me?.root && shouldUploadOnboardingData) {
      me.root.exampleDataLoaded = true;

      uploadOnboardingData(me).then(() => {
        me.root.exampleDataLoaded = true;
      });
    }
  }, [shouldUploadOnboardingData]);
}

async function uploadOnboardingData(me: MusicaAccount) {
  const trackFile = await (await fetch("/example.mp3")).blob();

  return uploadMusicTracks(me, [new File([trackFile], "Example song")]);
}
