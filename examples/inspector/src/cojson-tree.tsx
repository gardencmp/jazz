import clsx from "clsx";
import {
    AccountID,
    CoID,
    LocalNode,
    RawAccount,
    RawCoMap,
    RawCoValue,
} from "cojson";
import { useEffect, useState } from "react";
import { LinkIcon } from "./link-icon";

export function CoJsonTree({
    coValueId,
    node,
}: {
    coValueId: CoID<RawCoValue>;
    node: LocalNode;
}) {
    const [coValue, setCoValue] = useState<RawCoValue | "unavailable">();

    useEffect(() => {
        return node.subscribe(coValueId, (value) => {
            setCoValue(value);
        });
    });

    if (coValue === "unavailable") {
        return <div className="text-red-500">Unavailable</div>;
    }

    const values = coValue?.toJSON() || {};

    return <RenderCoValueJSON json={values} node={node} />;
}

function RenderObject({
    json,
    node,
}: {
    json: Record<string, any>;
    node: LocalNode;
}) {
    const [limit, setLimit] = useState(10);
    const hasMore = Object.keys(json).length > limit;

    const entries = Object.entries(json).slice(0, limit);
    return (
        <div className="flex gap-x-1 flex-col font-mono text-xs overflow-auto">
            {"{"}
            {entries.map(([key, value]) => {
                return (
                    <RenderObjectValue
                        property={key}
                        value={value}
                        node={node}
                    />
                );
            })}
            {hasMore ? (
                <div
                    className="text-gray-500 cursor-pointer"
                    onClick={() => setLimit((l) => l + 10)}
                >
                    ... {Object.keys(json).length - limit} more
                </div>
            ) : null}
            {"}"}
        </div>
    );
}

function RenderObjectValue({
    property,
    value,
    node,
}: {
    property: string;
    value: any;
    node: LocalNode;
}) {
    const [shouldLoad, setShouldLoad] = useState(false);

    const isCoValue =
        typeof value === "string" ? value?.startsWith("co_") : false;

    return (
        <div className={clsx(`flex group`)}>
            <div className="text-gray-500 flex items-start">
                <div className="flex items-center">
                    <RenderCoValueJSON json={property} node={node} />:{" "}
                </div>
            </div>

            {isCoValue ? (
                <div className={clsx(shouldLoad && "pb-2")}>
                    <div className="flex items-center ">
                        <div onClick={() => setShouldLoad((s) => !s)}>
                            <div className="w-8 text-center text-gray-700 font-mono px-1 text-xs rounded hover:bg-gray-300 cursor-pointer">
                                {shouldLoad ? `-` : `...`}
                            </div>
                        </div>
                        <a
                            href={`#/${value}`}
                            className="ml-2 group-hover:block hidden"
                        >
                            <LinkIcon />
                        </a>
                    </div>
                    <span>
                        {shouldLoad ? (
                            <CoJsonTree coValueId={value} node={node} />
                        ) : null}
                    </span>
                </div>
            ) : (
                <div className="">
                    <RenderCoValueJSON json={value} node={node} />
                </div>
            )}
        </div>
    );
}

function RenderCoList({ json, node }: { json: any[]; node: LocalNode }) {
    const [limit, setLimit] = useState(10);
    const [viewMode, setViewMode] = useState<"list" | "table">("list");
    const hasMore = json.length > limit;

    const entries = json.slice(0, limit);

    const toggleViewMode = () => {
        setViewMode(viewMode === "list" ? "table" : "list");
    };

    return (
        <div className="flex gap-x-1 flex-col font-mono text-xs overflow-auto">
            <div className="flex justify-between items-center mb-2">
                <button
                    className="text-blue-500 hover:underline"
                    onClick={toggleViewMode}
                >
                    Switch to {viewMode === "list" ? "Table" : "List"} View
                </button>
            </div>
            {viewMode === "list" ? (
                <>
                    {entries.map((value, idx) => (
                        <div key={idx} className="flex gap-x-1">
                            <RenderCoValueJSON json={value} node={node} />
                        </div>
                    ))}
                    {hasMore && (
                        <div
                            className="text-gray-500 cursor-pointer"
                            onClick={() => setLimit((l) => l + 10)}
                        >
                            ... {json.length - limit} more
                        </div>
                    )}
                </>
            ) : (
                <TableRenderer json={entries} node={node} />
            )}
        </div>
    );
}

function RenderCoValueJSON({
    json,
    node,
}: {
    json:
        | Record<string, any>
        | any[]
        | string
        | null
        | number
        | boolean
        | undefined;
    node: LocalNode;
}) {
    const [viewMode, setViewMode] = useState<"default" | "table" | "card">(
        "default",
    );

    if (typeof json === "undefined") {
        return <>"undefined"</>;
    } else if (
        Array.isArray(json) ||
        (typeof json === "object" && json !== null)
    ) {
        return (
            <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <button
                            className={clsx(
                                "px-2 py-1 mr-2 rounded",
                                viewMode === "default"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200",
                            )}
                            onClick={() => setViewMode("default")}
                        >
                            Default View
                        </button>
                        <button
                            className={clsx(
                                "px-2 py-1 mr-2 rounded",
                                viewMode === "table"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200",
                            )}
                            onClick={() => setViewMode("table")}
                        >
                            Table View
                        </button>
                        <button
                            className={clsx(
                                "px-2 py-1 rounded",
                                viewMode === "card"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200",
                            )}
                            onClick={() => setViewMode("card")}
                        >
                            Card View
                        </button>
                    </div>
                </div>
                {viewMode === "default" &&
                    (Array.isArray(json) ? (
                        <RenderCoList json={json} node={node} />
                    ) : (
                        <RenderObject json={json} node={node} />
                    ))}
                {viewMode === "table" && (
                    <TableRenderer data={json} node={node} />
                )}
                {viewMode === "card" && (
                    <CardRenderer data={json} node={node} />
                )}
            </div>
        );
    } else if (typeof json === "string") {
        if (json?.startsWith("co_")) {
            if (json.includes("_session_")) {
                return (
                    <>
                        <AccountInfo
                            accountID={json.split("_session_")[0] as AccountID}
                            node={node}
                        />{" "}
                        (sess {json.split("_session_")[1]})
                    </>
                );
            } else {
                return (
                    <>
                        <a className="underline" href={`#/${json}`}>
                            {'"'}
                            {json}
                            {'"'}
                        </a>
                    </>
                );
            }
        } else {
            return <div className="truncate max-w-64 ml-1">{json}</div>;
        }
    } else {
        return <div className="truncate max-w-64">{JSON.stringify(json)}</div>;
    }
}

function CardRenderer({
    data,
    node,
}: {
    data: any[] | Record<string, any>;
    node: LocalNode;
}) {
    const [resolvedData, setResolvedData] = useState<any[]>([]);
    const [visibleCards, setVisibleCards] = useState(6);
    const [hasMore, setHasMore] = useState(true);
    const isCoMapRecord = !Array.isArray(data);

    useEffect(() => {
        const resolveValues = async () => {
            if (Array.isArray(data)) {
                const resolved = await Promise.all(
                    data.map(async (item) => {
                        if (
                            typeof item === "string" &&
                            item.startsWith("co_")
                        ) {
                            const value = await node.load(
                                item as CoID<RawCoValue>,
                            );
                            return value === "unavailable"
                                ? item
                                : value?.toJSON();
                        }
                        return item;
                    }),
                );
                setResolvedData(resolved);
            } else {
                const resolved = await Promise.all(
                    Object.entries(data).map(async ([key, value]) => {
                        let resolvedValue = value;
                        if (
                            typeof value === "string" &&
                            value.startsWith("co_")
                        ) {
                            const loadedValue = await node.load(
                                value as CoID<RawCoValue>,
                            );
                            resolvedValue =
                                loadedValue === "unavailable"
                                    ? value
                                    : loadedValue?.toJSON();
                        }
                        return { _key: key, ...resolvedValue };
                    }),
                );
                setResolvedData(resolved);
            }
        };

        resolveValues();
    }, [data, node]);

    useEffect(() => {
        setHasMore(visibleCards < resolvedData.length);
    }, [visibleCards, resolvedData]);

    if (resolvedData.length === 0) {
        return <div>Loading...</div>;
    }

    const loadMore = () => {
        setVisibleCards((prevVisibleCards) => prevVisibleCards + 6);
    };

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resolvedData.slice(0, visibleCards).map((item, index) => (
                    <div key={index} className="bg-white shadow rounded-lg p-4">
                        {isCoMapRecord && (
                            <h3 className="text-lg font-semibold mb-2">
                                {item._key}
                            </h3>
                        )}
                        {Object.entries(item).map(([key, value]) => {
                            if (key === "_key" && isCoMapRecord) return null;
                            return (
                                <div key={key} className="mb-2">
                                    <span className="font-medium">{key}: </span>
                                    <RenderCoValueJSON
                                        json={value}
                                        node={node}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
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

function TableRenderer({
    data,
    node,
}: {
    data: any[] | Record<string, any>;
    node: LocalNode;
}) {
    const [resolvedData, setResolvedData] = useState<any[]>([]);
    const [visibleRows, setVisibleRows] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    const isCoMapRecord = !Array.isArray(data);

    useEffect(() => {
        const resolveValues = async () => {
            if (Array.isArray(data)) {
                const resolved = await Promise.all(
                    data.map(async (item) => {
                        if (
                            typeof item === "string" &&
                            item.startsWith("co_")
                        ) {
                            const value = await node.load(
                                item as CoID<RawCoValue>,
                            );
                            return value === "unavailable"
                                ? item
                                : value?.toJSON();
                        }
                        return item;
                    }),
                );
                setResolvedData(resolved);
            } else {
                const resolved = await Promise.all(
                    Object.entries(data).map(async ([key, value]) => {
                        let resolvedValue = value;
                        if (
                            typeof value === "string" &&
                            value.startsWith("co_")
                        ) {
                            const loadedValue = await node.load(
                                value as CoID<RawCoValue>,
                            );
                            resolvedValue =
                                loadedValue === "unavailable"
                                    ? value
                                    : loadedValue?.toJSON();
                        }
                        return { _key: key, ...resolvedValue };
                    }),
                );
                setResolvedData(resolved);
            }
        };

        resolveValues();
    }, [data, node]);

    useEffect(() => {
        setHasMore(visibleRows < resolvedData.length);
    }, [visibleRows, resolvedData]);

    if (resolvedData.length === 0) {
        return <div>Loading...</div>;
    }

    let keys = Array.from(
        new Set(resolvedData.flatMap((item) => Object.keys(item || {}))),
    );

    // If it's a CoMap Record, ensure '_key' is the first column and remove it from other columns
    if (isCoMapRecord) {
        keys = ["_key", ...keys.filter((k) => k !== "_key")];
    }

    const loadMore = () => {
        setVisibleRows((prevVisibleRows) => prevVisibleRows + 10);
    };

    return (
        <div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        {keys.map((key) => (
                            <th
                                key={key}
                                className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {key === "_key" ? "Key" : key}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {resolvedData.slice(0, visibleRows).map((item, index) => (
                        <tr key={index}>
                            {keys.map((key) => (
                                <td
                                    key={key}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                >
                                    <RenderCoValueJSON
                                        json={item[key]}
                                        node={node}
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

export function AccountInfo({
    accountID,
    node,
}: {
    accountID: CoID<RawAccount>;
    node: LocalNode;
}) {
    const [name, setName] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const account = await node.load(accountID);
            if (account === "unavailable") return;
            const profileID = account?.get("profile");
            if (profileID === undefined) return;
            const profile = await node.load(profileID as CoID<RawCoMap>);
            if (profile === "unavailable") return;
            setName(profile?.get("name") as string);
        })();
    }, [accountID, node]);

    return name ? (
        <Tag href={`#/${accountID}`} title={accountID}>
            <h1>{name}</h1>
        </Tag>
    ) : (
        <Tag href={`#/${accountID}`}>{accountID}</Tag>
    );
}

export function Tag({
    children,
    href,
    title,
}: {
    children: React.ReactNode;
    href?: string;
    title?: string;
}) {
    if (href) {
        return (
            <a
                href={href}
                className="border text-xs px-2 py-0.5 rounded hover:underline"
                title={title}
            >
                {children}
            </a>
        );
    }
    return (
        <span className="border text-xs px-2 py-0.5 rounded">{children}</span>
    );
}
