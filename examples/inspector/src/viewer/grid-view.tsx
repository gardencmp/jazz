import { CoID, LocalNode, RawCoValue } from "cojson";
import { JsonObject } from "cojson/src/jsonValue.ts";
import { CoMapPreview, ValueRenderer } from "./value-renderer";
import clsx from "clsx";
import { PageInfo, isCoId } from "./types";
import { ResolveIcon } from "./type-icon";

export function GridView({
    data,
    onNavigate,
    node,
}: {
    data: JsonObject;
    onNavigate: (pages: PageInfo[]) => void;
    node: LocalNode;
}) {
    const entries = Object.entries(data);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
            {entries.map(([key, child], childIndex) => (
                <div
                    key={childIndex}
                    className={clsx(
                        "bg-gray-100 p-3 rounded-lg transition-colors overflow-hidden",
                        isCoId(child)
                            ? "bg-white border hover:bg-gray-100/5 cursor-pointer shadow-sm"
                            : "bg-gray-50",
                    )}
                    onClick={() =>
                        isCoId(child) &&
                        onNavigate([
                            { coId: child as CoID<RawCoValue>, name: key },
                        ])
                    }
                >
                    <h3 className="truncate">
                        {isCoId(child) ? (
                            <span className="font-medium flex justify-between">
                                {key}

                                <div className="px-2 py-1 text-xs bg-gray-100 rounded">
                                    <ResolveIcon
                                        coId={child as CoID<RawCoValue>}
                                        node={node}
                                    />
                                </div>
                            </span>
                        ) : (
                            <span>{key}</span>
                        )}
                    </h3>
                    <div className="mt-2 text-sm">
                        {isCoId(child) ? (
                            <CoMapPreview
                                coId={child as CoID<RawCoValue>}
                                node={node}
                            />
                        ) : (
                            <ValueRenderer
                                json={child}
                                onCoIDClick={(coId) => {
                                    onNavigate([{ coId, name: key }]);
                                }}
                                compact
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
