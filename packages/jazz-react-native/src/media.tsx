import { ImageDefinition } from "jazz-tools";
import React, { useEffect, useState } from "react";

/** @category Media */
export function useProgressiveImg({
  image,
  maxWidth,
}: {
  image: ImageDefinition | null | undefined;
  maxWidth?: number;
}) {
  const [current, setCurrent] = useState<
    { src?: string; res?: `${number}x${number}` | "placeholder" } | undefined
  >(undefined);

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
            setCurrent({ src: blobURI, res: highestRes.res });
            return () => {
              setTimeout(() => URL.revokeObjectURL(blobURI), 200);
            };
          }
        }
      } else {
        setCurrent({
          src: update?.placeholderDataURL,
          res: "placeholder",
        });
      }
    });

    return unsub;
  }, [image?.id, maxWidth]);

  return {
    src: current?.src,
    res: current?.res,
    originalSize: image?.originalSize,
  };
}

/** @category Media */
export function ProgressiveImg({
  children,
  image,
  maxWidth,
}: {
  children: (result: {
    src: string | undefined;
    res: `${number}x${number}` | "placeholder" | undefined;
    originalSize: readonly [number, number] | undefined;
  }) => React.ReactNode;
  image: ImageDefinition | null | undefined;
  maxWidth?: number;
}) {
  const result = useProgressiveImg({ image, maxWidth });
  return result && children(result);
}
