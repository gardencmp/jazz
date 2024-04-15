import React, { useEffect, useState } from "react";
import { blobFromBinaryStream } from "jazz-browser";
import { ImageDefinition } from "jazz-tools";

export function useProgressiveImg({
    image,
}: {
    image: ImageDefinition | null | undefined;
}) {
    const [src, setSrc] = useState<string | undefined>(undefined);

    useEffect(() => {
        const highestRes = image?._highestResAvailable;
        if (highestRes) {
            const blob = blobFromBinaryStream(highestRes.stream);
            if (blob) {
                const blobURI = URL.createObjectURL(blob);
                setSrc(blobURI);
                return () => {
                    setTimeout(() => URL.revokeObjectURL(blobURI), 200);
                };
            }
        } else {
            setSrc(image?.placeholderDataURL);
        }
    }, [image?._highestResAvailable?.res]);

    return { src, originalSize: image?.originalSize };
}

export function ProgressiveImg({
    children,
    image,
}: {
    children: (result: {
        src: string | undefined;
        originalSize: readonly [number, number] | undefined;
    }) => React.ReactNode;
    image: ImageDefinition | null | undefined;
}) {
    const result = useProgressiveImg({ image });
    return result && children(result);
}
