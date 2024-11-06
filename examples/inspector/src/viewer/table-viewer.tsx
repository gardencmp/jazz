import { CoID, LocalNode, RawCoValue } from "cojson";
import { JsonObject } from "cojson/src/jsonValue.ts";
import { useMemo, useState } from "react";
import { LinkIcon } from "../link-icon";
import { PageInfo } from "./types";
import { useResolvedCoValues } from "./use-resolve-covalue";
import { ValueRenderer } from "./value-renderer";

export function TableView({
  data,
  node,
  onNavigate,
}: {
  data: JsonObject;
  node: LocalNode;
  onNavigate: (pages: PageInfo[]) => void;
}) {
  const [visibleRowsCount, setVisibleRowsCount] = useState(10);
  const [coIdArray, visibleRows] = useMemo(() => {
    const coIdArray = Array.isArray(data)
      ? data
      : Object.values(data).every(
            (k) => typeof k === "string" && k.startsWith("co_"),
          )
        ? Object.values(data).map((k) => k as CoID<RawCoValue>)
        : [];

    const visibleRows = coIdArray.slice(0, visibleRowsCount);

    return [coIdArray, visibleRows];
  }, [data, visibleRowsCount]);
  const resolvedRows = useResolvedCoValues(visibleRows, node);

  const hasMore = visibleRowsCount < coIdArray.length;

  if (!coIdArray.length) {
    return <div>No data to display</div>;
  }

  if (resolvedRows.length === 0) {
    return <div>Loading...</div>;
  }

  const keys = Array.from(
    new Set(resolvedRows.flatMap((item) => Object.keys(item.snapshot || {}))),
  );

  const loadMore = () => {
    setVisibleRowsCount((prevVisibleRows) => prevVisibleRows + 10);
  };

  return (
    <div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="sticky top-0 border-b">
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
          {resolvedRows.slice(0, visibleRowsCount).map((item, index) => (
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
                    json={(item.snapshot as JsonObject)[key]}
                    onCoIDClick={(coId) => {
                      async function handleClick() {
                        onNavigate([
                          {
                            coId: item.value!.id,
                            name: index.toString(),
                          },
                          {
                            coId: coId,
                            name: key,
                          },
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
      <div className="py-4 text-gray-500 flex items-center justify-between gap-2">
        <span>
          Showing {Math.min(visibleRowsCount, coIdArray.length)} of{" "}
          {coIdArray.length}
        </span>
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
