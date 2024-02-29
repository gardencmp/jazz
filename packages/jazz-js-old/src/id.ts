import { CojsonInternalTypes } from "cojson";



export type ID<T> = CojsonInternalTypes.RawCoID & {
    readonly __type: T;
};
