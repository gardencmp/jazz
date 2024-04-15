import { CoMap, BinaryCoStream } from "cojson";

export type FileBundle = CoMap<{
    [filename: string]: BinaryCoStream['id']
}>;