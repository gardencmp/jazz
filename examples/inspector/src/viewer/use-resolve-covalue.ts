import { CoID, LocalNode, RawBinaryCoStream, RawCoValue } from "cojson";
import { useEffect, useState } from "react";

export type CoJsonType = "comap" | "costream" | "colist";
export type ExtendedCoJsonType = "image" | "record" | "account" | "group";

type JSON = string | number | boolean | null | JSON[] | { [key: string]: JSON };
type JSONObject = { [key: string]: JSON };

type ResolvedImageDefinition = {
    originalSize: [number, number];
    placeholderDataURL?: string;
    [res: `${number}x${number}`]: RawBinaryCoStream["id"];
};

// Type guard for browser image
export const isBrowserImage = (
    coValue: JSONObject,
): coValue is ResolvedImageDefinition => {
    return "originalSize" in coValue && "placeholderDataURL" in coValue;
};

export type ResolvedGroup = {
    readKey: string;
    [key: string]: JSON;
};

export const isGroup = (coValue: JSONObject): coValue is ResolvedGroup => {
    return "readKey" in coValue;
};

export type ResolvedAccount = {
    profile: {
        name: string;
    };
    [key: string]: JSON;
};

export const isAccount = (coValue: JSONObject): coValue is ResolvedAccount => {
    return isGroup(coValue) && "profile" in coValue;
};

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
        } else if (isAccount(snapshot)) {
            extendedType = "account";
        } else if (isGroup(snapshot)) {
            extendedType = "group";
        } else {
            // This check is a bit of a hack
            // There might be a better way to do this
            const children = Object.values(snapshot).slice(0, 10);
            if (
                children.every(
                    (c) => typeof c === "string" && c.startsWith("co_"),
                ) &&
                children.length > 3
            ) {
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
        console.log("RETECHING", coValueIds);
        const fetchResults = async () => {
            if (coValueIds.length === 0) return;
            const resolvedValues = await Promise.all(
                coValueIds.map((coValueId) => resolveCoValue(coValueId, node)),
            );

            console.log({ resolvedValues });
            setResults(resolvedValues);
        };

        fetchResults();
    }, [coValueIds, node]);

    return results;
}
