import ReactDOM from "react-dom/client";
import {
    RawAccount,
    CoID,
    RawCoValue,
    SessionID,
    LocalNode,
    AgentSecret,
    AccountID,
    cojsonInternals,
    WasmCrypto,
} from "cojson";
import { clsx } from "clsx";
import { AccountInfo, CoJsonTree, Tag } from "./cojson-tree";
import { useEffect, useState } from "react";
import { createWebSocketPeer } from "cojson-transport-ws";
import { Effect } from "effect";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

function App() {
    const [accountID, setAccountID] = useState<CoID<RawAccount>>(
        localStorage["inspectorAccountID"]
    );
    const [accountSecret, setAccountSecret] = useState<AgentSecret>(
        localStorage["inspectorAccountSecret"]
    );

    const [coValueId, setCoValueId] = useState<CoID<RawCoValue>>(
        window.location.hash.slice(2) as CoID<RawCoValue>
    );

    useEffect(() => {
        window.addEventListener("hashchange", () => {
            setCoValueId(window.location.hash.slice(2) as CoID<RawCoValue>);
        });
    });

    const [localNode, setLocalNode] = useState<LocalNode>();

    useEffect(() => {
        if (!accountID || !accountSecret) return;
        WasmCrypto.create().then(async (crypto) => {
            const wsPeer = await Effect.runPromise(
                createWebSocketPeer({
                    id: "mesh",
                    websocket: new WebSocket("wss://mesh.jazz.tools"),
                    role: "server",
                })
            );
            const node = await LocalNode.withLoadedAccount({
                accountID: accountID,
                accountSecret: accountSecret,
                sessionID: cojsonInternals.newRandomSessionID(accountID),
                peersToLoadFrom: [wsPeer],
                crypto,
                migration: async () => {
                    console.log("Not running any migration in inspector");
                },
            });
            setLocalNode(node);
        });
    }, [accountID, accountSecret]);

    return (
        <div className="flex flex-col items-center w-screen h-screen p-2 gap-2">
            <div className="flex gap-2 items-center">
                Account
                <input
                    className="border p-2 rounded"
                    placeholder="Account ID"
                    value={accountID}
                    onChange={(e) => {
                        setAccountID(e.target.value as AccountID);
                        localStorage["inspectorAccountID"] = e.target.value;
                    }}
                />
                <input
                    type="password"
                    className="border p-2 rounded"
                    placeholder="Account Secret"
                    value={accountSecret}
                    onChange={(e) => {
                        setAccountSecret(e.target.value as AgentSecret);
                        localStorage["inspectorAccountSecret"] = e.target.value;
                    }}
                />
                {localNode ? (
                    <AccountInfo accountID={accountID} node={localNode} />
                ) : (
                    ""
                )}
            </div>
            <div className="flex gap-2 items-center">
                CoValue ID
                <input
                    className="border p-2 rounded min-w-[20rem]"
                    placeholder="CoValue ID"
                    value={coValueId}
                    onChange={(e) =>
                        setCoValueId(e.target.value as CoID<RawCoValue>)
                    }
                />
            </div>
            {coValueId && localNode ? (
                <Inspect coValueId={coValueId} node={localNode} />
            ) : null}
        </div>
    );
}

// function ImageCoValue({ value }: { value: ImageDefinition["_shape"] }) {
//     const keys = Object.keys(value);
//     const keyIncludingRes = keys.find((key) => key.includes("x"));
//     const idToResolve = keyIncludingRes
//         ? value[keyIncludingRes as `${number}x${number}`]
//         : null;

//     if (!idToResolve) return <div>Can't find image</div>;

//     const [blobURL, setBlobURL] = useState<string>();

//     useEffect(() => {

//     })

//     return (
//         <img
//             src={image?.blobURL || value.placeholderDataURL}
//             alt="placeholder"
//         />
//     );
// }

function Inspect({
    coValueId,
    node,
}: {
    coValueId: CoID<RawCoValue>;
    node: LocalNode;
}) {
    const [coValue, setCoValue] = useState<RawCoValue | "unavailable">();

    useEffect(() => {
        return node.subscribe(coValueId, (coValue) => {
            setCoValue(coValue);
        });
    }, [node, coValueId]);

    if (coValue === "unavailable") {
        return <div>Unavailable</div>;
    }

    const values = coValue?.toJSON() || {};
    const isImage =
        typeof values === "object" && "placeholderDataURL" in values;
    const isGroup = coValue?.core.header.ruleset?.type === "group";

    const entires = Object.entries(values as any) as [string, string][];
    const onlyCoValues = entires.filter(([key]) => key.startsWith("co_"));

    let title = "";
    if (isImage) {
        title = "Image";
    } else if (isGroup) {
        title = "Group";
    }

    return (
        <div className="mb-auto">
            <h1 className="text-xl font-bold mb-2">
                Inspecting {title}{" "}
                <span className="text-gray-500 text-sm">{coValueId}</span>
            </h1>

            {isGroup ? (
                <p>
                    {onlyCoValues.length > 0 ? <h3>Permissions</h3> : ""}
                    <div className="flex gap-2 flex-col">
                        {onlyCoValues?.map(([key, value]) => (
                            <div className="flex gap-1 items-center">
                                <span className="bg-gray-200 text-xs px-2 py-0.5 rounded">
                                    {value}
                                </span>
                                <AccountInfo
                                    accountID={key as CoID<RawAccount>}
                                    node={node}
                                />
                            </div>
                        ))}
                    </div>
                </p>
            ) : (
                <span className="">
                    Group{" "}
                    <Tag href={`#/${coValue?.group.id}`}>
                        {coValue?.group.id}
                    </Tag>
                </span>
            )}
            {/* {isImage ? (
                <div className="my-2">
                    <ImageCoValue value={values as any} />
                </div>
            ) : null} */}
            <pre className="max-w-[80vw] overflow-scroll text-sm mt-4">
                <CoJsonTree coValueId={coValueId} node={node} />
            </pre>
            <h2 className="text-lg font-semibold mt-10 mb-4">Sessions</h2>
            {coValue && <Sessions coValue={coValue} node={node} />}
        </div>
    );
}

function Sessions({ coValue, node }: { coValue: RawCoValue; node: LocalNode }) {
    const validTx = coValue.core.getValidSortedTransactions();
    return (
        <div className="max-w-[80vw] border rounded">
            {[...coValue.core.sessionLogs.entries()].map(
                ([sessionID, session]) => (
                    <div
                        key={sessionID}
                        className="mv-10 flex gap-2 border-b p-5 flex-wrap  flex-col"
                    >
                        <div className="flex gap-2 flex-row">
                            <SessionInfo
                                sessionID={sessionID}
                                transactionCount={session.transactions.length}
                                node={node}
                            />
                        </div>
                        <div className="flex gap-1 flex-wrap max-h-64 overflow-y-auto p-1 bg-gray-50 rounded">
                            {session.transactions.map((tx, txIdx) => {
                                const correspondingValidTx = validTx.find(
                                    (validTx) =>
                                        validTx.txID.sessionID === sessionID &&
                                        validTx.txID.txIndex == txIdx
                                );
                                return (
                                    <div
                                        key={txIdx}
                                        className={clsx(
                                            "text-xs flex-1 p-2 border rounded min-w-36 max-w-40 overflow-scroll bg-white",
                                            !correspondingValidTx &&
                                                "bg-red-50 border-red-100"
                                        )}
                                    >
                                        <div>
                                            {new Date(
                                                tx.madeAt
                                            ).toLocaleString()}
                                        </div>
                                        <div>{tx.privacy}</div>
                                        <pre>
                                            {correspondingValidTx
                                                ? JSON.stringify(
                                                      correspondingValidTx.changes,
                                                      undefined,
                                                      2
                                                  )
                                                : "invalid/undecryptable"}
                                        </pre>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-xs">
                            {session.lastHash} / {session.lastSignature}{" "}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

function SessionInfo({
    sessionID,
    transactionCount,
    node,
}: {
    sessionID: SessionID;
    transactionCount: number;
    node: LocalNode;
}) {
    let Prefix = sessionID.startsWith("co_") ? (
        <AccountInfo
            accountID={sessionID.split("_session_")[0] as CoID<RawAccount>}
            node={node}
        />
    ) : (
        <pre className="text-xs">{sessionID.split("_session_")[0]}</pre>
    );

    return (
        <div>
            {Prefix}
            <div>
                <span className="text-xs">
                    Session {sessionID.split("_session_")[1]}
                </span>
                <span className="text-xs text-gray-600 font-medium">
                    {" "}
                    - {transactionCount} txs
                </span>
            </div>
        </div>
    );
}
