import React, { useEffect, useState } from "react";
import { ImageDefinition } from "jazz-tools";

/** @category Media */
export function useProgressiveImg({
    image,
    maxWidth
}: {
    image: ImageDefinition | null | undefined;
    maxWidth?: number
}) {
    const [src, setSrc] = useState<string | undefined>(undefined);

    useEffect(() => {
        const highestRes = image?.highestResAvailable({ maxWidth });
        if (highestRes) {
            const blob = highestRes.stream.toBlob();
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
    }, [image?.highestResAvailable?.({ maxWidth })?.res]);

    return { src, originalSize: image?.originalSize };
}

/** @category Media */
export function ProgressiveImg({
    children,
    image,
    maxWidth
}: {
    children: (result: {
        src: string | undefined;
        originalSize: readonly [number, number] | undefined;
    }) => React.ReactNode;
    image: ImageDefinition | null | undefined;
    maxWidth?: number;
}) {
    const result = useProgressiveImg({ image, maxWidth });
    return result && children(result);
}
