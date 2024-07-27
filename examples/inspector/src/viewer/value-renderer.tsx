import clsx from "clsx";
import { CoID, JsonValue, LocalNode, RawCoValue } from "cojson";
import { LinkIcon } from "../link-icon";
import {
    CoJsonType,
    isBrowserImage,
    useResolvedCoValue,
} from "./use-resolve-covalue";
import { TypeIcon } from "./type-icon";
import React from "react";

// Is there a chance we can pass the actual CoValue here?
export function ValueRenderer({
    json,
    compact,
    onCoIDClick,
}: {
    json: JsonValue | undefined;
    compact?: boolean;
    onCoIDClick?: (childNode: CoID<RawCoValue>) => void;
}) {
    if (typeof json === "undefined" || json === undefined) {
        return <span className="text-gray-400">undefined</span>;
    }

    if (json === null) {
        return <span className="text-gray-400">null</span>;
    }

    if (Array.isArray(json)) {
        return <span>Array({json.length})</span>;
    }

    if (typeof json === "string" && json.startsWith("co_")) {
        return (
            <span
                className={clsx(
                    "inline-flex gap-1 items-center",
                    onCoIDClick &&
                        "text-blue-500 cursor-pointer hover:underline",
                )}
                onClick={() => {
                    onCoIDClick?.(json as CoID<RawCoValue>);
                }}
            >
                {json}
                {onCoIDClick && <LinkIcon />}
            </span>
        );
    }

    if (typeof json === "string") {
        return (
            <span className="p-1 px-1.5 rounded bg-green-700/5  text-green-900 font-mono">
                {json}
            </span>
        );
    }

    if (typeof json === "number") {
        return <span className="text-purple-500">{json}</span>;
    }

    if (typeof json === "boolean") {
        return <span className="text-orange-500">{json.toString()}</span>;
    }

    if (Array.isArray(json)) {
        return <span className="cursor-pointer">Array({json.length})</span>;
    }

    if (typeof json === "object") {
        return (
            <span className="cursor-pointer">
                Object ({Object.keys(json).length})
            </span>
        );
    }

    return <span>{String(json)}</span>;
}

export const CoMapPreview = ({
    coId,
    node,
    limit = 6,
}: {
    coId: CoID<RawCoValue>;
    node: LocalNode;
    limit?: number;
}) => {
    const { snapshot, type, extendedType } = useResolvedCoValue(coId, node);

    if (!snapshot) return <div>Loading...</div>;

    if (extendedType === "image" && isBrowserImage(snapshot)) {
        return (
            <div>
                <img
                    src={snapshot.placeholderDataURL}
                    className="size-8 border-2 border-white drop-shadow-md my-2"
                />
                <span className="text-gray-500 text-sm">
                    {snapshot.originalSize[0]} x {snapshot.originalSize[1]}
                </span>
            </div>
        );
    }

    if (extendedType === "record") {
        return <div>Record ({Object.keys(snapshot).length})</div>;
    }

    if (type === "colist") {
        return (
            <div className="flex flex-col gap-2">
                {Object.keys(snapshot).length} items
            </div>
        );
    }

    return (
        <div className="text-sm flex flex-col gap-2 items-start">
            <div className="grid grid-cols-[auto_1fr] gap-2">
                {Object.entries(snapshot)
                    .slice(0, limit)
                    .map(([key, value]) => (
                        <React.Fragment key={key}>
                            <span className="font-medium">{key}: </span>
                            <span>
                                <ValueRenderer json={value} />
                            </span>
                        </React.Fragment>
                    ))}
            </div>
            {Object.entries(snapshot).length > limit && (
                <div className="text-left text-xs text-gray-500 mt-2">
                    {Object.entries(snapshot).length - limit} more
                </div>
            )}
        </div>
    );
};
