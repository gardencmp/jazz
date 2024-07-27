import {
    CoID,
    JsonValue,
    LocalNode,
    RawBinaryCoStream,
    RawCoValue,
} from "cojson";
import { useEffect, useState } from "react";

export type CoJsonType = "comap" | "costream" | "colist";
export type ExtendedCoJsonType = "image" | "record";

type JSON = string | number | boolean | null | JSON[] | { [key: string]: JSON };
type JSONObject = { [key: string]: JSON };

// Type guard for browser image
export const isBrowserImage = (
    coValue: JSONObject,
): coValue is ResolvedImageDefinition => {
    return "originalSize" in coValue && "placeholderDataURL" in coValue;
};

// Helper function to check if objects have the same keys
function haveSameKeys(objects: JSONObject[]): boolean {
    if (objects.length < 2) return true;
    const keys = objects.map((obj) => Object.keys(obj).sort().join(","));
    return keys.every((k) => k === keys[0]);
}

export async function resolveCoValue(
    coValueId: CoID<RawCoValue>,
    node: LocalNode,
): Promise<
    | {
          value: RawCoValue;
          snapshot: JSONObject;
          type: CoJsonType | null;
          extendedType: ExtendedCoJsonType | undefined;
      }
    | {
          value: undefined;
          snapshot: "unavailable";
          type: null;
          extendedType: undefined;
      }
> {
    const value = await node.load(coValueId);

    if (value === "unavailable") {
        return {
            value: undefined,
            snapshot: "unavailable",
            type: null,
            extendedType: undefined,
        };
    }

    const snapshot = value.toJSON() as JSONObject;
    const type = value.type as CoJsonType;

    // Determine extended type
    let extendedType: ExtendedCoJsonType | undefined;

    if (type === "comap") {
        if (isBrowserImage(snapshot)) {
            extendedType = "image";
        } else {
            // Check for record type (assuming we have access to children here)
            const children = Object.values(snapshot).slice(0, 10);
            if (children.length >= 2 && haveSameKeys(children)) {
                extendedType = "record";
            }
        }
    }

    return {
        value,
        snapshot,
        type,
        extendedType,
    };
}

type ResolvedImageDefinition = {
    originalSize: [number, number];
    placeholderDataURL?: string;
    [res: `${number}x${number}`]: RawBinaryCoStream["id"];
};

export function useResolvedCoValue(
    coValueId: CoID<RawCoValue>,
    node: LocalNode,
) {
    const [result, setResult] =
        useState<Awaited<ReturnType<typeof resolveCoValue>>>();

    useEffect(() => {
        resolveCoValue(coValueId, node).then(setResult);
    }, [coValueId, node]);

    return (
        result || {
            value: undefined,
            snapshot: undefined,
            type: undefined,
            extendedType: undefined,
        }
    );
}

export function useResolvedCoValues(
    coValueIds: CoID<RawCoValue>[],
    node: LocalNode,
) {
    const [results, setResults] = useState<
        Awaited<ReturnType<typeof resolveCoValue>>[]
    >([]);

    useEffect(() => {
        const fetchResults = async () => {
            if (coValueIds.length === 0) return;
            const resolvedValues = await Promise.all(
                coValueIds.map((coValueId) => resolveCoValue(coValueId, node)),
            );

            console.log({ resolvedValues });
            setResults(resolvedValues);
        };

        fetchResults();
    }, [...coValueIds]);

    return results;
}
