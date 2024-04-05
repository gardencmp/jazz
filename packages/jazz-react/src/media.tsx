import React, { useEffect, useState } from "react";
import { blobFromBinaryStream } from "jazz-browser";
import { ImageDefinition } from "jazz-js";

export function useProgressiveImg({
    image,
}: {
    image: ImageDefinition | undefined;
}) {
    const [src, setSrc] = useState<string | undefined>(undefined);

    useEffect(() => {
        const highestRes = image?.highestResAvailable;
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
    }, [image?.highestResAvailable?.res]);

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
    image: ImageDefinition | undefined;
}) {
    const result = useProgressiveImg({ image });
    return result && children(result);
}
