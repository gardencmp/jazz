import {
    BinaryCoStream,
    CoMap,
    co,
    subscriptionsScopes,
} from "../../internal.js";

export class ImageDefinition extends CoMap<ImageDefinition> {
    originalSize = co.json<[number, number]>();
    placeholderDataURL? = co.string;

    [co.items] = co.ref(BinaryCoStream);
    [res: `${number}x${number}`]: co<BinaryCoStream | null>;

    get highestResAvailable():
        | { res: `${number}x${number}`; stream: BinaryCoStream }
        | undefined {
        if (!subscriptionsScopes.get(this)) {
            console.warn(
                "highestResAvailable() only makes sense when used within a subscription."
            );
        }

        const resolutions = Object.keys(this).filter((key) =>
            key.match(/^\d+x\d+$/)
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