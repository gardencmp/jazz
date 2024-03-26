import { Co, S } from "../../index.js";

export class ImageDefinition extends Co.map({
    originalSize: S.tuple(S.number, S.number),
    placeholderDataURL: S.optional(S.string),
}, {
    key: S.templateLiteral(S.string, S.literal("x"), S.string),
    value: Co.binaryStream,
}).as<ImageDefinition>() {}