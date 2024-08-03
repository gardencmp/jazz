import clsx from "clsx";
import { CoID, LocalNode, RawCoStream, RawCoValue } from "cojson";
import { useEffect, useState } from "react";
import { useResolvedCoValue } from "./use-resolve-covalue";
import { GridView } from "./grid-view";
import { PageInfo } from "./types";
import { TableView } from "./table-viewer";
import { TypeIcon } from "./type-icon";
import { CoStreamView } from "./co-stream-view";
import { AccountOrGroupPreview } from "./value-renderer";

type PageProps = {
    coId: CoID<RawCoValue>;
    node: LocalNode;
    name: string;
    onNavigate: (newPages: PageInfo[]) => void;
    onHeaderClick?: () => void;
    isTopLevel?: boolean;
    style: React.CSSProperties;
};

export function Page({
    coId,
    node,
    name,
    onNavigate,
    onHeaderClick,
    style,
    isTopLevel,
}: PageProps) {
    const { value, snapshot, type, extendedType } = useResolvedCoValue(
        coId,
        node,
    );
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    const supportsTableView = type === "colist" || extendedType === "record";

    // Automatically switch to table view if the page is a CoMap record
    useEffect(() => {
        if (supportsTableView) {
            setViewMode("table");
        }
    }, [supportsTableView]);

    if (snapshot === "unavailable") {
        return <div style={style}>Data unavailable</div>;
    }

    if (!snapshot) {
        return <div style={style}></div>;
    }

    return (
        <div
            style={style}
            className={clsx(
                "absolute inset-0 border border-gray-900/5 bg-clip-padding bg-white rounded-xl shadow-lg p-6 animate-in",
            )}
        >
            {!isTopLevel && (
                <div
                    className="absolute inset-x-0 top-0 h-10"
                    aria-label="Back"
                    onClick={() => {
                        onHeaderClick?.();
                    }}
                    aria-hidden="true"
                ></div>
            )}
            <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold flex items-start flex-col gap-1">
                        <span>
                            {name}
                            {typeof snapshot === "object" &&
                            "name" in snapshot ? (
                                <span className="text-gray-600 font-medium">
                                    {" "}
                                    {
                                        (
                                            snapshot as {
                                                name: string;
                                            }
                                        ).name
                                    }
                                </span>
                            ) : null}
                        </span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-700 font-medium py-0.5 px-1 -ml-0.5 rounded bg-gray-700/5 inline-block font-mono">
                            {type && (
                                <TypeIcon
                                    type={type}
                                    extendedType={extendedType}
                                />
                            )}
                        </span>
                        <span className="text-xs text-gray-700 font-medium py-0.5 px-1 -ml-0.5 rounded bg-gray-700/5 inline-block font-mono">
                            {coId}
                        </span>
                    </div>
                </div>
                {/* {supportsTableView && (
          <button
            onClick={toggleViewMode}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {viewMode === "grid" ? "Table View" : "Grid View"}
          </button>
        )} */}
            </div>
            <div className="overflow-auto max-h-[calc(100%-4rem)]">
                {type === "costream" ? (
                    <CoStreamView
                        data={snapshot}
                        onNavigate={onNavigate}
                        node={node}
                        value={value as RawCoStream}
                    />
                ) : viewMode === "grid" ? (
                    <GridView
                        data={snapshot}
                        onNavigate={onNavigate}
                        node={node}
                    />
                ) : (
                    <TableView
                        data={snapshot}
                        node={node}
                        onNavigate={onNavigate}
                    />
                )}
                {/* --- */}
                {extendedType !== "account" && extendedType !== "group" && (
                    <div className="text-xs text-gray-500 mt-4">
                        Owned by{" "}
                        <AccountOrGroupPreview
                            coId={value.group.id}
                            node={node}
                            showId
                            onClick={() => {
                                onNavigate([
                                    { coId: value.group.id, name: "owner" },
                                ]);
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
