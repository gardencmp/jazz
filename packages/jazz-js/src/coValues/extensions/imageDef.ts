import * as S from "@effect/schema/Schema";
import { CoMapOf } from "../coMap/coMapOf.js";
import { BinaryCoStreamImpl } from "../coStream/coStreamOf.js";

export class ImageDefinition extends CoMapOf({
    originalSize: S.tuple(S.number, S.number),
    placeholderDataURL: S.optional(S.string),
}, {
    key: S.templateLiteral(S.string, S.literal("x"), S.string),
    value: BinaryCoStreamImpl,
}).as<ImageDefinition>() {}