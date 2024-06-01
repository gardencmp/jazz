import React, { useEffect, useState } from "react";
import { ImageDefinition } from "jazz-tools";

/** @category Media */
export function useProgressiveImg({
    image,
    maxWidth,
}: {
    image: ImageDefinition | null | undefined;
    maxWidth?: number;
}) {
    const [src, setSrc] = useState<string | undefined>(undefined);

    useEffect(() => {
        let lastHighestRes: string | undefined;
        if (!image) return;
        const unsub = image.subscribe({}, (update) => {
            const highestRes = update?.highestResAvailable({ maxWidth });
            if (highestRes) {
                if (highestRes.res !== lastHighestRes) {
                    lastHighestRes = highestRes.res;
                    const blob = highestRes.stream.toBlob();
                    if (blob) {
                        const blobURI = URL.createObjectURL(blob);
                        setSrc(blobURI);
                        return () => {
                            setTimeout(() => URL.revokeObjectURL(blobURI), 200);
                        };
                    }
                }
            } else {
                setSrc(update?.placeholderDataURL);
            }
        });

        return unsub;
    }, [image?.id, maxWidth]);

    return { src, originalSize: image?.originalSize };
}

/** @category Media */
export function ProgressiveImg({
    children,
    image,
    maxWidth,
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
