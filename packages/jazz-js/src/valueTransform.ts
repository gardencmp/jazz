import { imm } from "./immutables/index.js";
import { Schema } from "./schema.js";
import { CoMapOf } from "./coValues/coMap/impl.js";
import { CoListOf } from "./coValues/coList/impl.js";
import { BinaryCoStream } from "./coValues/binaryCoStream/binaryCoStream.js";
import { CoValueSchemaBase } from "./baseInterfaces.js";

export abstract class ValueTransform<Inner extends CoValueSchemaBase = CoValueSchemaBase> extends Schema {

}

export class ImageDefinitionInner extends CoMapOf({
    fullSize: imm.map({
        width: imm.number,
        height: imm.number,
    }),
    placeholderDataURL: imm.string,
    resolutions: CoListOf(imm.map({
        width: imm.number,
        height: imm.number,
        stream: BinaryCoStream,
    })),
}) {}

// export class ImageDefinition extends ValueTransform<typeof ImageDefinitionInner> {

// }