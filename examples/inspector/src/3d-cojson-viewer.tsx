import React, { useState, useEffect, useMemo } from "react";
import { CoID, LocalNode, RawCoValue } from "cojson";
import clsx from "clsx";
import { LinkIcon } from "./link-icon";

type CoJsonType = "comap" | "costream" | "colist";

// Core functions

async function resolveCoValue(coValueId: CoID<RawCoValue>, node: LocalNode) {
  const value = await node.load(coValueId);
  if (value === "unavailable") {
    return { data: "unavailable", type: null };
  }
  console.log(value);
  return {
    data: value.toJSON(),
    type: value.type as CoJsonType,
  };
}

function createPageData(
  resolvedData: any,
  type: CoJsonType | null,
  coValueId: CoID<RawCoValue>,
  name?: string,
): JSONNode {
  function mapEntry([key, value]: [string, any]): any {
    const entry = {
      name: key,
      type:
        typeof value === "object"
          ? Array.isArray(value)
            ? "array"
            : "object"
          : "value",
      value: value,
      coValueId:
        typeof value === "string" && value.startsWith("co_")
          ? (value as CoID<RawCoValue>)
          : undefined,
    };
    4;
    if (typeof value === "object") {
      entry.children = Object.entries(value).map(mapEntry);
    }

    return entry;
  }

  return {
    name: name || coValueId || "Unknown",
    coValueId: coValueId,
    type: Array.isArray(resolvedData) ? "array" : "object",
    coType: type,
    children: resolvedData ? Object.entries(resolvedData).map(mapEntry) : [],
  };
}

function useResolvedCoValue(
  coValueId: CoID<RawCoValue>,
  node: LocalNode,
  name?: string,
) {
  const [resolvedData, setResolvedData] = useState<any | "unavailable">();
  const [type, setType] = useState<null | CoJsonType>(null);

  useEffect(() => {
    resolveCoValue(coValueId, node).then(({ data, type }) => {
      setResolvedData(data);
      setType(type);
    });
  }, [coValueId, node]);

  const pageData = useMemo(
    () => createPageData(resolvedData, type, coValueId, name),
    [resolvedData, type, name, coValueId],
  );

  return {
    data: resolvedData,
    type,
    pageData,
  };
}

type JSONNode = {
  name: string;
  type: string;
  coType?: CoJsonType | null;
  value?: any;
  coValueId?: CoID<RawCoValue>;
  children?: JSONNode[];
};

type PageProps = {
  coValueId: CoID<RawCoValue>;
  node: LocalNode;
  name: string;
  onChildClick: (childNode: JSONNode | JSONNode[]) => void;
  onPageClick?: () => void;
  isTopLevel?: boolean;
  style: React.CSSProperties;
};

function haveSameKeys(objects: object[]): boolean {
  if (objects.length === 0) return true;
  const keys = Object.keys(objects[0]);
  return objects.every(
    (obj) =>
      Object.keys(obj).length === keys.length &&
      keys.every((key) => obj.hasOwnProperty(key)),
  );
}

function Page({
  coValueId,
  node,
  name,
  onChildClick,
  onPageClick,
  style,
  isTopLevel,
}: PageProps) {
  const {
    data: resolvedData,
    type,
    pageData,
  } = useResolvedCoValue(coValueId, node, name);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const isCoMapRecord = useMemo(() => {
    if (!pageData || !pageData.children) return false;

    const childrenToCheck = pageData.children.slice(0, 10);
    if (
      childrenToCheck.length >= 2 &&
      haveSameKeys(childrenToCheck.map((child) => child.value))
    ) {
      return true;
    }

    return false;
  }, [pageData]);

  // Automatically switch to table view if the page is a CoMap record
  useEffect(() => {
    if (type === "colist" || isCoMapRecord) {
      setViewMode("table");
    }
  }, [type, isCoMapRecord]);

  if (resolvedData === "unavailable") {
    return <div style={style}>Data unavailable</div>;
  }

  if (!pageData) {
    return <div style={style}></div>;
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "table" : "grid");
  };

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
            onPageClick?.();
          }}
          aria-hidden="true"
        ></div>
      )}
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold flex items-start flex-col gap-1">
            {pageData.name}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700 font-medium py-0.5 px-1 -ml-0.5 rounded bg-gray-700/5 inline-block font-mono">
              {pageData.coType}
              {isCoMapRecord ? (
                <span className="font-medium"> Record</span>
              ) : null}
            </span>
            <span className="text-xs text-gray-700 font-medium py-0.5 px-1 -ml-0.5 rounded bg-gray-700/5 inline-block font-mono">
              {pageData.coValueId}
            </span>
          </div>
        </div>
        <button
          onClick={toggleViewMode}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {viewMode === "grid" ? "Table View" : "Grid View"}
        </button>
      </div>
      <div className="overflow-auto max-h-[calc(100%-4rem)]">
        {viewMode === "grid" ? (
          <GridView
            data={pageData.children || []}
            onChildClick={onChildClick}
            node={node}
          />
        ) : (
          <TableView
            data={pageData.children || []}
            node={node}
            onChildClick={onChildClick}
          />
        )}
      </div>
    </div>
  );
}

function RenderCoValueJSON({
  json,
  onCoIDClick,
}: {
  json: any;
  onCoIDClick?: (childNode: CoID<RawCoValue>) => void;
}) {
  if (typeof json === "undefined") {
    return <span className="text-gray-400">undefined</span>;
  }

  if (json === null) {
    return <span className="text-gray-400">null</span>;
  }

  if (typeof json === "string") {
    if (json.startsWith("co_")) {
      return (
        <span
          className={clsx(
            "inline-flex gap-1 items-center",
            onCoIDClick && "text-blue-500 cursor-pointer hover:underline",
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

const ArrayPreview = ({
  array,
  node,
  onCoValueClick,
  limit = 5,
}: {
  array: any[];
  node: LocalNode;
  onCoValueClick: (coValueId: CoID<RawCoValue>) => void;
  limit?: number;
}) => {
  if (array.length === 0) return <div>Empty</div>;

  return (
    <div className="text-sm font-mono bg-indigo-700/5 px-1 py-0.5 rounded inline-block text-indigo-700">
      {"["}
      {array.slice(0, limit).map((item, index) => (
        <React.Fragment key={index}>
          <RenderCoValueJSON json={item} />
          {index !== array.length - 1 && index !== limit - 1 && ", "}
        </React.Fragment>
      ))}
      {array.length > limit && ", ..."}
      {"]"}
      {array.length > limit && (
        <div className="text-left text-xs text-gray-500 mt-2">
          {array.length - limit} more
        </div>
      )}
    </div>
  );
};

function GridView({
  data,
  onChildClick,
  node,
}: {
  data: JSONNode[];
  onChildClick: (child: JSONNode) => void;
  node: LocalNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
      {data.map((child, childIndex) => (
        <div
          key={childIndex}
          className={clsx(
            "bg-gray-100 p-4 rounded-lg transition-colors overflow-hidden truncate",
            child.coValueId
              ? "bg-white border hover:bg-gray-100/5 cursor-pointer shadow-sm"
              : "bg-gray-100",
          )}
          onClick={() => onChildClick(child)}
        >
          <h3 className="font-semibold">{child.name}</h3>
          <p>
            {child.coValueId ? (
              <CoMapPreview coId={child.coValueId} node={node} />
            ) : child.type === "value" ? (
              <RenderCoValueJSON json={child.value} node={node} />
            ) : child.type === "array" ? (
              <ArrayPreview array={child.value} node={node} />
            ) : (
              child.type
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

function TableView({
  data,
  node,
  onChildClick,
}: {
  data: JSONNode[];
  node: LocalNode;
  onChildClick: (child: JSONNode[] | JSONNode) => void;
}) {
  const [resolvedData, setResolvedData] = useState<any[]>([]);
  const [visibleRows, setVisibleRows] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const resolveValues = async () => {
      const resolved = await Promise.all(
        data.map(async (child) => {
          if (child.coValueId) {
            const value = await node.load(child.coValueId);
            return value === "unavailable" ? child.value : value?.toJSON();
          }

          return child.value;
        }),
      );
      setResolvedData(resolved);
    };

    resolveValues();
  }, [data, node]);

  useEffect(() => {
    setHasMore(visibleRows < resolvedData.length);
  }, [visibleRows, resolvedData]);

  if (resolvedData.length === 0) {
    return <div>Loading...</div>;
  }

  const keys = Array.from(
    new Set(resolvedData.flatMap((item) => Object.keys(item || {}))),
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
          {resolvedData.slice(0, visibleRows).map((item, index) => (
            <tr key={index}>
              <td className="px-1 py-0">
                <button
                  onClick={() => onChildClick(data[index] as JSONNode)}
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
                  <RenderCoValueJSON
                    json={item[key]}
                    onCoIDClick={(coId) => {
                      async function handleClick() {
                        const { data: subData, type } = await resolveCoValue(
                          coId,
                          node,
                        );

                        const pageData = createPageData(
                          subData,
                          type,
                          coId,
                          key,
                        );
                        const rowData = data[index];

                        onChildClick([rowData, pageData]);
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

const CoMapPreview = ({
  coId,
  node,
  limit = 6,
}: {
  coId: CoID<RawCoValue>;
  node: LocalNode;
  limit?: number;
}) => {
  const { data } = useResolvedCoValue(coId, node);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="text-sm">
      {Object.entries(data)
        .slice(0, limit)
        .map(([key, value]) => (
          <div key={key}>
            <span className="font-medium">{key}: </span>
            <RenderCoValueJSON
              json={value}
              node={node}
              // onClick={(coValueId) => onCoValueClick(coValueId)}
            />
          </div>
        ))}
      {Object.entries(data).length > limit && (
        <div className="text-left text-xs text-gray-500 mt-2">
          {Object.entries(data).length - limit} more
        </div>
      )}
    </div>
  );
};

type PageInfo = {
  coValueId: CoID<RawCoValue>;
  name: string;
};

export default function CoJsonViewer({
  coValueId,
  node,
}: {
  coValueId: CoID<RawCoValue>;
  node: LocalNode;
}) {
  const [path, setPath] = useState<PageInfo[]>([{ coValueId, name: "Root" }]);

  const handleChildClick = (childNodes: JSONNode | JSONNode[]) => {
    const newPath = (Array.isArray(childNodes) ? childNodes : [childNodes])
      .filter((childNode) => childNode.coValueId)
      .map((childNode) => ({
        coValueId: childNode.coValueId!, // TODO: Hopefully no longer needed with 5.5
        name: childNode.name,
      }));

    setPath([...path, ...newPath]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setPath(path.slice(0, index + 1));
  };

  const handlePageClick = () => {
    if (path.length === 1) return;
    setPath(path.slice(0, path.length - 1));
  };

  return (
    <div className="w-full h-screen bg-gray-100 p-4 overflow-hidden">
      <div className="mb-4 z-20 relative bg-indigo-400/10 backdrop-blur-sm rounded-lg inline-flex px-3 py-2 whitespace-pre transition-all items-center">
        <img
          src="jazz-logo.png"
          className="h-5 mr-2"
          onClick={() => handleBreadcrumbClick(0)}
        />
        {path.map((page, index) => (
          <span key={index}>
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className="text-indigo-700 hover:underline"
            >
              {page.name}
            </button>
            <span className="text-indigo-500/30">
              {index < path.length - 1 && " / "}
            </span>
          </span>
        ))}
      </div>
      <div className="relative h-[calc(100vh-6rem)]">
        {path.map((page, index) => (
          <Page
            key={`${page.coValueId}-${index}`}
            coValueId={page.coValueId}
            node={node}
            name={page.name}
            onPageClick={handlePageClick}
            onChildClick={handleChildClick}
            isTopLevel={index === path.length - 1}
            style={{
              transform: `translateZ(${(index - path.length + 1) * 200}px) scale(${
                1 - (path.length - index - 1) * 0.05
              }) translateY(${-(index - path.length + 1) * -4}%)`,
              opacity: 1 - (path.length - index - 1) * 0.05,
              zIndex: index,
              transitionProperty: "transform, opacity",
              transitionDuration: "0.3s",
              transitionTimingFunction: "ease-out",
            }}
          />
        ))}
      </div>
    </div>
  );
}
