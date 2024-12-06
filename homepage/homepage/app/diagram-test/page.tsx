import clsx from "clsx";
import bs58 from "bs58";

export default function Page() {
  const scenario1 = {
    alice_session_1: [
      {
        payload: { key: "color", value: "red" },
        t: 0,
      },
      {
        payload: { key: "height", value: 17 },
        t: 7,
      },
    ],
    bob_session_1: [
      {
        payload: { key: "color", value: "blue" },
        t: 5,
      },
      {
        payload: { key: "color", value: "bleen" },
        t: 7,
      },
      {
        payload: { key: "color", value: "green" },
        t: 8,
      },
    ],
    bob_session_2: [
      {
        payload: { key: "height", value: 18 },
        t: 4,
      },
    ],
  };

  return (
    <div className="flex flex-col justify-center gap-5 p-5">
      <div>Under the hood</div>
      <p>Basic setup</p>
      <CoValueCoreDiagram
        header={{
          owner: "Group A",
          createdAt: "2024-12-06...",
          uniqueness: "fc89fjwo3",
        }}
        sessions={scenario1}
        highlightLastPerKey={false}
        showHashAndSignature={false}
      />
      <p>Showing latest (effective) transactions per key</p>
      <CoValueCoreDiagram
        header={{
          owner: "Group A",
          createdAt: "2024-12-06...",
          uniqueness: "fc89fjwo3",
        }}
        sessions={scenario1}
        highlightLastPerKey={true}
        showHashAndSignature={false}
      />
      <p>Showing hash and signature</p>
      <CoValueCoreDiagram
        header={{
          owner: "Group A",
          createdAt: "2024-12-06...",
          uniqueness: "fc89fjwo3",
        }}
        sessions={scenario1}
        highlightLastPerKey={false}
        showHashAndSignature={true}
      />
    </div>
  );
}

const encoder = new TextEncoder();

function CoValueCoreDiagram({
  header,
  sessions,
  highlightLastPerKey,
  showHashAndSignature,
}: {
  header: object;
  sessions: {
    [key: `${string}_session_${string}`]: {
      payload: { key: string } & object;
      t: number;
    }[];
  };
  highlightLastPerKey?: boolean;
  showHashAndSignature?: boolean;
}) {
  return (
    <div className="overflow-x-scroll">
      <div className="flex gap-3 not-prose p-10 bg-black rounded-lg">
        <div className="flex-1 bg-stone-900 p-2 rounded-lg rounded-l-xl">
          <pre className="text-xs">
            {JSON.stringify(header, null, 2)
              .replace(/\n\s+/g, "\n")
              .replace(/,/g, "")
              .replace(/[{}]\n?/g, "")}
          </pre>
        </div>
        <div className="flex-[4] flex flex-col gap-3">
          {Object.entries(sessions).map(([key, log]) => (
            <div key={key} className="flex gap-1">
              <div className="bg-stone-900 p-2 rounded rounded-l-lg min-w-[8rem]">
                <span
                  className={
                    userColors[key.split("_")[0] as keyof typeof userColors]
                  }
                >
                  {key.split("_")[0]}
                </span>{" "}
                <span className="text-xs">
                  {key.split("_").slice(1).join(" ")}
                </span>
              </div>
              {log.map((item, idx) => {
                const isLastPerKey =
                  highlightLastPerKey &&
                  item.t >=
                    Object.values(sessions)
                      .flatMap((session) => session)
                      .filter((i) => i.payload.key === item.payload.key)
                      .reduce((max, item) => Math.max(max, item.t), 0);
                return (
                  <div
                    key={JSON.stringify(item)}
                    className={clsx(
                      "bg-stone-900 rounded min-w-[9.5rem]",
                      isLastPerKey ? "outline outline-amber-500" : "",
                    )}
                  >
                    <pre className="text-sm p-2 border-b border-stone-700">
                      {JSON.stringify(item.payload, null, 2)
                        .replace(/\n\s+/g, "\n")
                        .replace(/,/g, "")
                        .replace(/[{}]\n?/g, "")}
                    </pre>
                    <div className="flex justify-between">
                      <pre className="text-xs p-2">idx={idx}</pre>
                      <pre className="text-xs p-2">t={item.t}</pre>
                    </div>
                  </div>
                );
              })}
              {showHashAndSignature && (
                <div className="p-2 rounded min-w-[9.5rem]">
                  <pre className="text-xs">→ {fakeHash(log)}</pre>
                  <pre
                    className={clsx(
                      "text-xs p-2",
                      userColors[key.split("_")[0] as keyof typeof userColors],
                    )}
                  >
                    {"   ↪ "}
                    {fakeSignature(log)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const userColors = {
  alice: "text-emerald-500",
  bob: "text-blue-500",
};

function fakeHash(session: { payload: object; t: number }[]) {
  return (
    "hash_x" +
    bs58.encode(
      encoder.encode(
        hashCode(
          session.reduce((acc, item) => acc + JSON.stringify(item), ""),
        ) + "",
      ),
    )
  );
}

function fakeSignature(session: { payload: object; t: number }[]) {
  return (
    "sig_x" +
    bs58.encode(
      encoder.encode(
        hashCode(
          hashCode(
            session.reduce((acc, item) => acc + JSON.stringify(item), ""),
          ) + "",
        ) + "",
      ),
    )
  );
}

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
