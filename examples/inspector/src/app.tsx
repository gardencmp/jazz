import { WithJazz, useJazz, DemoAuth, useAutoSub } from "jazz-react";
import ReactDOM from "react-dom/client";
import { HashRoute } from "hash-slash";
import { Account, CoID, CoValue, SessionID } from "cojson";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <WithJazz
        auth={DemoAuth({ appName: "Jazz Chat Example" })}
        apiKey="api_z9d034j3t34ht034ir"
    >
        <App />
    </WithJazz>
);

function App() {
    return (
        <div className="flex flex-col items-center justify-between w-screen h-screen p-2 dark:bg-black dark:text-white">
            <button
                onClick={useJazz().logOut}
                className="rounded mb-5 px-2 py-1 bg-stone-200 dark:bg-stone-800 dark:text-white self-end"
            >
                Log Out
            </button>
            {HashRoute(
                {
                    "/": <Home />,
                    "/:id": (id) => <Inspect coValueId={id as CoID<CoValue>} />,
                },
                { reportToParentFrame: true }
            )}
        </div>
    );
}

function Home() {
    return (
        <form
            className="mb-auto"
            onSubmit={(event) => {
                const coValueId = (event.target as any).coValueId
                    .value as CoID<CoValue>;
                location.hash = "/" + coValueId;
                event.preventDefault();
            }}
        >
            <input name="coValueId" className="border" />
            <button>Inspect</button>
        </form>
    );
}

function Inspect({ coValueId }: { coValueId: CoID<CoValue> }) {
    const coValue = useAutoSub(coValueId);

    return (
        <div className="mb-auto">
            <h1 className="text-xl font-bold">Inspecting {coValueId}</h1>
            {coValue?.meta.group.id !== coValueId && (
                <p>
                    Group{" "}
                    <a
                        className="underline"
                        href={`#/${coValue?.meta.group.id}`}
                    >
                        {coValue?.meta.group.id}
                    </a>
                </p>
            )}
            <pre className="max-w-[80vw] overflow-scroll">
                <RenderCoValueJSON json={coValue?.meta.coValue.toJSON()} />
            </pre>
            <h2 className=" text-lg font-semibold mt-10">Sessions</h2>
            {coValue && <Sessions coValue={coValue.meta.coValue} />}
        </div>
    );
}

function RenderCoValueJSON({
    json,
}: {
    json:
        | Record<string, any>
        | any[]
        | string
        | null
        | number
        | boolean
        | undefined;
}) {
    if (typeof json === "undefined") {
        return <>"undefined"</>;
    } else if (Array.isArray(json)) {
        return (
            <>
                [
                {json.map((item, idx) => (
                    <><RenderCoValueJSON json={item} />{(idx === json.length - 1 )? "" : ", "}</>
                ))}
                ]
            </>
        );
    } else if (typeof json === "object" && json && Object.getPrototypeOf(json) === Object.prototype) {
        return (
            <>
                {"{"}
                {Object.entries(json).map(([key, value]) => (
                    <div key={key} className="flex gap-2 ml-5">
                        <RenderCoValueJSON json={key} />:{" "}
                        <RenderCoValueJSON json={value} />
                    </div>
                ))}
                {"}"}
            </>
        );
    } else if (typeof json === "string") {
        if (json.startsWith("co_")) {
            return (
                <>

                    <a className="underline" href={`#/${json}`}>
                        {'"'}{json}{'"'}
                    </a>

                </>
            );
        } else {
            return <>{JSON.stringify(json)}</>;
        }
    } else {
        return <>{JSON.stringify(json)}</>;
    }
}

function Sessions({ coValue }: { coValue: CoValue }) {
    const validTx = coValue.core.getValidSortedTransactions();
    return (
        <div className="max-w-[80vw] overflow-scroll">
            {[...coValue.core.sessionLogs.entries()].map(
                ([sessionID, session]) => (
                    <div
                        key={sessionID}
                        className="mv-10 flex gap-2 border-b p-5"
                    >
                        <SessionInfo sessionID={sessionID} />
                        {session.transactions.map((tx, txIdx) => {
                            const correspondingValidTx = validTx.find(
                                (validTx) =>
                                    validTx.txID.sessionID === sessionID &&
                                    validTx.txID.txIndex == txIdx
                            );
                            return (
                                <div
                                    key={txIdx}
                                    className="text-xs p-2 border rounded min-w-36 max-w-36 overflow-scroll"
                                >
                                    <div>
                                        {new Date(tx.madeAt).toLocaleString()}
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
                        <div className="text-xs">
                            {session.lastHash} / {session.lastSignature}{" "}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

function SessionInfo({ sessionID }: { sessionID: SessionID }) {
    if (sessionID.startsWith("co_")) {
        return (
            <div>
                <AccountInfo
                    accountID={sessionID.split("_session_")[0] as CoID<Account>}
                />
                Session {sessionID.split("_session_")[1]}
            </div>
        );
    } else {
        return (
            <div>
                <pre className="text-xs">{sessionID.split("_session_")[0]}</pre>
                Session {sessionID.split("_session_")[1]}
            </div>
        );
    }
}

function AccountInfo({ accountID }: { accountID: CoID<Account> }) {
    const account = useAutoSub(accountID);
    return (
        <div>
            <h1>{account?.profile?.name}</h1>
            <pre className="text-xs">{account?.id}</pre>
        </div>
    );
}
