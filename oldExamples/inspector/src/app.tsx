import {
  WithJazz,
  useJazz,
  DemoAuth,
  useAutoSub,
  useBinaryStream,
} from "jazz-react";
import ReactDOM from "react-dom/client";
import { HashRoute } from "hash-slash";
import { Account, CoID, CoValue, SessionID } from "cojson";
import { clsx } from "clsx";
import { ImageDefinition } from "cojson/src/media";
import { CoJsonTree } from "./cojson-tree";

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
    <div className="flex flex-col items-center justify-between w-screen h-screen p-2 ">
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

function Tag({ children, href }: { children: React.ReactNode; href?: string }) {
  if (href) {
    return (
      <a
        href={href}
        className="border text-xs px-2 py-0.5 rounded hover:underline"
      >
        {children}
      </a>
    );
  }
  return <span className="border text-xs px-2 py-0.5 rounded">{children}</span>;
}

function ImageCoValue({ value }: { value: ImageDefinition["_shape"] }) {
  const keys = Object.keys(value);
  const keyIncludingRes = keys.find((key) => key.includes("x"));
  const idToResolve = keyIncludingRes
    ? value[keyIncludingRes as `${number}x${number}`]
    : null;

  if (!idToResolve) return <div>Can't find image</div>;

  const image = useBinaryStream(idToResolve);

  return (
    <img src={image?.blobURL || value.placeholderDataURL} alt="placeholder" />
  );
}

function Inspect({ coValueId }: { coValueId: CoID<CoValue> }) {
  const coValue = useAutoSub(coValueId);

  const values = coValue?.meta.coValue.toJSON() || {};
  const isImage = "placeholderDataURL" in values;
  const isGroup = coValue?.meta.group.id === coValueId;

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
                <AccountInfo accountID={key as CoID<Account>} />
              </div>
            ))}
          </div>
        </p>
      ) : (
        <span className="">
          Group{" "}
          <Tag href={`#/${coValue?.meta.group.id}`}>
            {coValue?.meta.group.id}
          </Tag>
        </span>
      )}
      {isImage ? (
        <div className="my-2">
          <ImageCoValue value={values as any} />
        </div>
      ) : null}
      <pre className="max-w-[80vw] overflow-scroll text-sm mt-4">
        <CoJsonTree coValueId={coValueId} />
      </pre>
      <h2 className="text-lg font-semibold mt-10 mb-4">Sessions</h2>
      {coValue && <Sessions coValue={coValue.meta.coValue} />}
    </div>
  );
}

function Sessions({ coValue }: { coValue: CoValue }) {
  const validTx = coValue.core.getValidSortedTransactions();
  return (
    <div className="max-w-[80vw] border rounded">
      {[...coValue.core.sessionLogs.entries()].map(([sessionID, session]) => (
        <div
          key={sessionID}
          className="mv-10 flex gap-2 border-b p-5 flex-wrap  flex-col"
        >
          <div className="flex gap-2 flex-row">
            <SessionInfo
              sessionID={sessionID}
              transactionCount={session.transactions.length}
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
                    !correspondingValidTx && "bg-red-50 border-red-100"
                  )}
                >
                  <div>{new Date(tx.madeAt).toLocaleString()}</div>
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
      ))}
    </div>
  );
}

function SessionInfo({
  sessionID,
  transactionCount,
}: {
  sessionID: SessionID;
  transactionCount: number;
}) {
  let Prefix = sessionID.startsWith("co_") ? (
    <AccountInfo accountID={sessionID.split("_session_")[0] as CoID<Account>} />
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

function AccountInfo({ accountID }: { accountID: CoID<Account> }) {
  const account = useAutoSub(accountID);
  return (
    <div className="flex items-center gap-2">
      <h1>{account?.profile?.name}</h1>

      <Tag href={`#/${accountID}`}>{account?.id}</Tag>
    </div>
  );
}
