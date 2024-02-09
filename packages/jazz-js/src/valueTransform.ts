import { BinaryCoStream, CoMapOf, CoValueSchemaBase, imm } from ".";
import { Schema } from "./schema.js";

export abstract class ValueTransform<Inner extends CoValueSchemaBase = CoValueSchemaBase> extends Schema {

}

export class ImageDefinitionInner extends CoMapOf({
    originalSize: imm.tuple(imm.number, imm.number),
    placeholderDataURL: imm.string,
    resolutions: CoListOf(imm.object({
        width: imm.number,
        height: imm.number,
        stream: BinaryCoStream,
    })),
    // [res: `${number}x${number}`]: BinaryCoStream;
}) {}

export class ImageDefinition extends ValueTransform<typeof ImageDefinitionInner> {

}