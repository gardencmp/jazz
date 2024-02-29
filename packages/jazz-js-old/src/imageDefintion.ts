import { imm } from "./immutables/index.js";
import { Schema } from "./schema.js";
import { CoMapOf } from "./coValues/coMap/impl.js";
import { CoListOf } from "./coValues/coList/impl.js";
import { BinaryCoStream } from "./coValues/binaryCoStream/binaryCoStream.js";
import { CoValueSchemaBase } from "./baseInterfaces.js";


export class ImageDefinitionInner extends CoMapOf({
    originalSize: imm.tuple(imm.number, imm.number),
    placeholderDataURL: imm.string,
    "...": BinaryCoStream
}) {}

export class ImageDefinition extends CoListOf(ImageDefinitionInner) {
    get resolutions() {

    }

    highestAvailableResolution() {

    }
}