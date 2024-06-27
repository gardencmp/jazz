import clsx from "clsx";
import { AccountID, CoID, LocalNode, RawAccount, RawCoMap, RawCoValue } from "cojson";
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

function RenderCoValueArray({ json, node }: { json: any[]; node: LocalNode }) {
    const [limit, setLimit] = useState(10);
    const hasMore = json.length > limit;

    const entries = json.slice(0, limit);
    return (
        <div className="flex gap-x-1 flex-col font-mono text-xs overflow-auto">
            {entries.map((value, idx) => {
                return (
                    <div key={idx} className="flex gap-x-1">
                        <RenderCoValueJSON json={value} node={node} />
                    </div>
                );
            })}
            {hasMore ? (
                <div
                    className="text-gray-500 cursor-pointer"
                    onClick={() => setLimit((l) => l + 10)}
                >
                    ... {json.length - limit} more
                </div>
            ) : null}
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
    if (typeof json === "undefined") {
        return <>"undefined"</>;
    } else if (Array.isArray(json)) {
        return (
            <div className="">
                <span className="text-gray-500">[</span>
                <div className="ml-2">
                    <RenderCoValueArray json={json} node={node} />
                </div>
                <span className="text-gray-500">]</span>
            </div>
        );
    } else if (
        typeof json === "object" &&
        json &&
        Object.getPrototypeOf(json) === Object.prototype
    ) {
        return <RenderObject json={json} node={node} />;
    } else if (typeof json === "string") {
        if (json?.startsWith("co_")) {
            if (json.includes("_session_")) {
                return (
                    <>
                        <AccountInfo accountID={json.split("_session_")[0] as AccountID} node={node}/>{" "}
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

export function AccountInfo({ accountID, node }: { accountID: CoID<RawAccount>, node: LocalNode }) {
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
        })()
    }, [accountID, node]);

    return name ? (
            <Tag href={`#/${accountID}`} title={accountID}><h1>{name}</h1></Tag>
    ) : (
        <Tag href={`#/${accountID}`}>{accountID}</Tag>
    );
}

export function Tag({
    children,
    href,
    title
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
