import { co, subscriptionsScopes } from "../../internal.js";
import { FileStream } from "../coFeed.js";
import { CoMap } from "../coMap.js";

/** @category Media */
export class ImageDefinition extends CoMap {
  originalSize = co.json<[number, number]>();
  placeholderDataURL? = co.string;

  [co.items] = co.ref(FileStream);
  [res: `${number}x${number}`]: co<FileStream | null>;

  highestResAvailable(options?: {
    maxWidth?: number;
  }): { res: `${number}x${number}`; stream: FileStream } | undefined {
    if (!subscriptionsScopes.get(this)) {
      console.warn(
        "highestResAvailable() only makes sense when used within a subscription.",
      );
    }

    const resolutions = Object.keys(this).filter(
      (key) =>
        key.match(/^\d+x\d+$/) &&
        (options?.maxWidth === undefined ||
          Number(key.split("x")[0]) <= options.maxWidth),
    ) as `${number}x${number}`[];

    resolutions.sort((a, b) => {
      const aWidth = Number(a.split("x")[0]);
      const bWidth = Number(b.split("x")[0]);
      return aWidth - bWidth;
    });

    let highestAvailableResolution: `${number}x${number}` | undefined;

    for (const resolution of resolutions) {
      if (this[resolution] && this[resolution]?.getChunks()) {
        highestAvailableResolution = resolution;
      } else {
        return (
          highestAvailableResolution && {
            res: highestAvailableResolution,
            stream: this[highestAvailableResolution]!,
          }
        );
      }
    }
    return (
      highestAvailableResolution && {
        res: highestAvailableResolution,
        stream: this[highestAvailableResolution]!,
      }
    );
  }
}
