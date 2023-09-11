import { CoID, Media } from "cojson";
import { loadImage, LoadingImageInfo } from "jazz-browser-media-images";
import { useJazz } from "jazz-react";
import { useEffect, useState } from "react";
export { createImage } from "jazz-browser-media-images";

export function useLoadImage(
    imageID?: CoID<Media.ImageDefinition>
): LoadingImageInfo | undefined {
    const { localNode } = useJazz();

    const [imageInfo, setImageInfo] = useState<LoadingImageInfo>();

    useEffect(() => {
        if (!imageID) return;
        const unsubscribe = loadImage(imageID, localNode, (imageInfo) => {
            setImageInfo(imageInfo);
        });

        return unsubscribe;
    }, [imageID, localNode]);

    return imageInfo;
}
