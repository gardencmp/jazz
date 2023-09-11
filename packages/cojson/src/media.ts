import { CoMap } from './coValues/coMap.js'
import { CoID } from './coValue.js'
import { BinaryCoStream } from './coValues/coStream.js'

export type ImageDefinition = CoMap<{
    originalSize: [number, number];
    placeholderDataURL?: string;
    [res: `${number}x${number}`]: CoID<BinaryCoStream>;
}>;