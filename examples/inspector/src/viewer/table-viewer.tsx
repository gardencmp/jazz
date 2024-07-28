import { CoID, LocalNode, RawCoValue } from "cojson";
import { JsonObject } from "cojson/src/jsonValue";
import { PageInfo } from "./types";
import { useEffect, useState } from "react";
import { ValueRenderer } from "./value-renderer";
import { LinkIcon } from "../link-icon";
import { resolveCoValue, useResolvedCoValues } from "./use-resolve-covalue";

export function TableView({
    data,
    node,
    onNavigate,
}: {
    data: JsonObject;
    node: LocalNode;
    onNavigate: (pages: PageInfo[]) => void;
}) {
    const coIdArray = Array.isArray(data)
        ? data
        : Object.values(data).every(
                (k) => typeof k === "string" && k.startsWith("co_"),
            )
          ? Object.values(data).map((k) => k as CoID<RawCoValue>)
          : [];

    const [visibleRows, setVisibleRows] = useState(10);
    const resolvedRows = useResolvedCoValues(
        coIdArray.slice(0, visibleRows),
        node,
    );

    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        setHasMore(visibleRows < resolvedRows.length);
    }, [visibleRows, resolvedRows]);

    if (!coIdArray.length) {
        return <div>No data to display</div>;
    }

    if (resolvedRows.length === 0) {
        return <div>Loading...</div>;
    }

    const keys = Array.from(
        new Set(
            resolvedRows.flatMap((item) => Object.keys(item.snapshot || {})),
        ),
    );

    const loadMore = () => {
        setVisibleRows((prevVisibleRows) => prevVisibleRows + 10);
    };

    return (
        <div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        {["", ...keys].map((key) => (
                            <th
                                key={key}
                                className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 rounded"
                            >
                                {key}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {resolvedRows.slice(0, visibleRows).map((item, index) => (
                        <tr key={index}>
                            <td className="px-1 py-0">
                                <button
                                    onClick={() =>
                                        onNavigate([
                                            {
                                                coId: item.value!.id,
                                                name: index.toString(),
                                            },
                                        ])
                                    }
                                    className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded"
                                >
                                    <LinkIcon />
                                </button>
                            </td>
                            {keys.map((key) => (
                                <td
                                    key={key}
                                    className="px-4 py-4 whitespace-nowrap text-sm text-gray-500"
                                >
                                    <ValueRenderer
                                        json={item.snapshot[key]}
                                        onCoIDClick={(coId) => {
                                            async function handleClick() {
                                                onNavigate([
                                                    {
                                                        coId: item.value!.id,
                                                        name: index.toString(),
                                                    },
                                                    { coId: coId, name: key },
                                                ]);
                                            }

                                            handleClick();
                                        }}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {hasMore && (
                <div className="mt-4 text-center">
                    <button
                        onClick={loadMore}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Show More
                    </button>
                </div>
            )}
        </div>
    );
}
