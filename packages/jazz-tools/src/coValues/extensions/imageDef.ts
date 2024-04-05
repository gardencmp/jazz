import * as S from "@effect/schema/Schema";
import { CoMapOf } from "../coMap/coMapOf.js";
import { BinaryCoStreamImpl } from "../coStream/coStreamOf.js";
import { BinaryCoStream } from "../coStream/coStream.js";
import { subscriptionsScopes } from "../../subscriptionScope.js";

export class ImageDefinition extends CoMapOf(
    {
        originalSize: S.tuple(S.number, S.number),
        placeholderDataURL: S.optional(S.string),
    },
    {
        key: S.templateLiteral(S.string, S.literal("x"), S.string),
        value: BinaryCoStreamImpl,
    }
).as<ImageDefinition>() {
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
