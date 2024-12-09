import bs58 from "bs58";
import clsx from "clsx";

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
        payload: { key: "color", value: "amber" },
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

  const header = {
    type: "comap",
    ownedBy: "co_zCCymDTETFr2rv9U",
    createdAt: "2024-12-06...",
    uniqueness: "fc89fjwo3",
  };

  return (
    <div className="flex flex-col justify-center gap-5 p-5 text-stone-300">
      <div>Under the hood</div>
      <p>Basic setup</p>
      <CoValueCoreDiagram
        header={header}
        sessions={scenario1}
        highlightLastPerKey={false}
        showHashAndSignature={false}
        encryptedItems={false}
      />
      <p>Showing latest (effective) transactions per key</p>
      <CoValueCoreDiagram
        header={header}
        sessions={scenario1}
        highlightLastPerKey={true}
        showHashAndSignature={false}
        encryptedItems={false}
      />
      <p>Showing hash and signature</p>
      <CoValueCoreDiagram
        header={header}
        sessions={scenario1}
        highlightLastPerKey={false}
        showHashAndSignature={true}
        encryptedItems={false}
      />
      <p>Showing encrypted items</p>
      <CoValueCoreDiagram
        header={header}
        sessions={scenario1}
        highlightLastPerKey={false}
        showHashAndSignature={true}
        encryptedItems={true}
      />
      <p>Showing group</p>
      <CoValueCoreDiagram
        header={header}
        sessions={scenario1}
        highlightLastPerKey={false}
        showHashAndSignature={true}
        encryptedItems={true}
        group={{
          roles: {
            alice: "admin",
            bob: "writer",
          },
          currentKey: "keyID_z89fdhd9",
        }}
      />
      <p>Showing extended group</p>
      <CoValueCoreDiagram
        header={header}
        sessions={scenario1}
        highlightLastPerKey={false}
        showHashAndSignature={true}
        encryptedItems={true}
        group={{
          roles: {
            alice: "admin",
            bob: "writer",
          },
          currentKey: "keyID_z89fdhd9",
        }}
        showFullGroup={true}
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
  encryptedItems,
  group,
  showFullGroup,
}: {
  header: object;
  sessions: {
    [key: `${string}_session_${string}`]: {
      payload: { key: string } & object;
      t: number;
    }[];
  };
  highlightLastPerKey: boolean;
  showHashAndSignature: boolean;
  encryptedItems: boolean;
  group?: {
    roles: { [user: string]: "reader" | "writer" | "admin" };
    currentKey: string;
  };
  showFullGroup?: boolean;
}) {
  return (
    <div className="overflow-x-scroll">
      <div className="p-10 bg-black rounded-lg flex flex-col gap-10">
        {group &&
          (showFullGroup ? (
            <CoValueContent
              header={headerForGroup(group)}
              sessions={sessionsForGroup(group)}
              highlightLastPerKey={false}
              showHashAndSignature={false}
              encryptedItems={false}
            />
          ) : (
            <div className="relative">
              <SimplifiedGroup group={group} />
              <div className="text-xs py-2 absolute -bottom-8">
                {fakeCoID(headerForGroup(group))}
              </div>
            </div>
          ))}
        <CoValueContent
          header={header}
          sessions={sessions}
          highlightLastPerKey={highlightLastPerKey}
          showHashAndSignature={showHashAndSignature}
          encryptedItems={encryptedItems}
        />
      </div>
    </div>
  );
}

function HeaderContent({ header }: { header: object }) {
  return (
    <div className="bg-stone-900 h-full px-4 py-3 rounded-lg">
      <div className="flex justify-between text-stone-500 mb-2">header</div>
      <pre className="text-xs leading-6">
        {JSON.stringify(header, null, 2)
          .replace(/\n\s+/g, "\n")
          .replace(/,/g, "")
          .replace(/[{}]\n?/g, "")}
      </pre>
    </div>
  );
}

function SimplifiedGroup({
  group,
}: {
  group: {
    roles: { [user: string]: "reader" | "writer" | "admin" };
    currentKey: string;
  };
}) {
  return (
    <div className="bg-stone-900 py-3 px-4 rounded-lg max-w-[30rem] leading-relaxed">
      {Object.entries(group.roles).map(([user, role]) => (
        <div key={user}>
          <span className={clsx("font-semibold", userColors[user])}>
            {user}
          </span>
          : {role}
        </div>
      ))}
      <div>
        readKey:{" "}
        <span className="font-semibold text-fuchsia-500">
          {group.currentKey}
        </span>
      </div>
      {Object.keys(group.roles).map((user) => (
        <div key={user}>
          <span className="font-semibold text-fuchsia-500">
            {group.currentKey}
          </span>
          _for_
          <span className={clsx("font-semibold", userColors[user])}>
            {user}
          </span>
          :{" "}
          {
            fakeEncryptedPayload({
              encrKey: group.currentKey + user,
            }).split("\n")[0]
          }
        </div>
      ))}
    </div>
  );
}

function headerForGroup(group: {
  roles: { [user: string]: "reader" | "writer" | "admin" };
  currentKey: string;
}) {
  return {
    type: "comap",
    isGroup: true,
    owner: Object.keys(group.roles)[0],
    createdAt: "2024-12-06...",
    uniqueness: group.currentKey,
  };
}

function sessionsForGroup(group: {
  roles: { [user: string]: "reader" | "writer" | "admin" };
  currentKey: string;
}) {
  return {
    [Object.keys(group.roles)[0] + "_session_1"]: [
      {
        payload: {
          key: "readKey",
          value: group.currentKey,
        },
        t: 0,
      },
      ...Object.entries(group.roles).flatMap(([user, role]) => [
        {
          payload: {
            key: user,
            value: role,
          },
          t: 0,
        },
        {
          payload: {
            key: group.currentKey + "_for_" + user,
            value: fakeEncryptedPayload({
              encrKey: group.currentKey + user,
            }).split("\n")[0],
          },
          t: 0,
        },
      ]),
    ],
  };
}

function SessionHeader({ sessionKey }: { sessionKey: string }) {
  return (
    <div className="bg-stone-900 py-2 px-3 flex justify-between items-baseline rounded-lg min-w-[8rem]">
      <span
        className={clsx([
          userColors[sessionKey.split("_")[0]],
          "font-semibold",
        ])}
      >
        {sessionKey.split("_")[0]}
      </span>{" "}
      <span className="text-xs">
        {sessionKey.split("_").slice(1).join(" ")}
      </span>
    </div>
  );
}

function CoValueContent({
  header,
  sessions,
  highlightLastPerKey,
  showHashAndSignature,
  encryptedItems,
}: {
  header: object;
  sessions: {
    [key: string]: { payload: { key: string } & object; t: number }[];
  };
  highlightLastPerKey: boolean;
  showHashAndSignature: boolean;
  encryptedItems: boolean;
}) {
  return (
    <div className="flex gap-5 not-prose relative">
      <div className="flex-1 min-w-[19rem]">
        <HeaderContent header={header} />
        <div className="text-xs py-2 absolute -bottom-8">
          h(header) = {fakeCoID(header)} ("CoValue ID")
        </div>
      </div>
      <div className="flex-[6] flex flex-col gap-5">
        {Object.entries(sessions).map(([key, log]) => (
          <div key={key} className="flex gap-1">
            <SessionHeader sessionKey={key} />
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
                    "bg-stone-900 min-w-[9.5rem]",
                    isLastPerKey ? "outline outline-blue-500" : "",
                    {
                      "rounded-l-lg ml-1.5": idx === 0,
                    },
                  )}
                >
                  {encryptedItems ? (
                    <pre className="text-sm leading-6 py-2 px-3 border-b border-stone-600 text-fuchsia-500">
                      {fakeEncryptedPayload(item.payload)}
                    </pre>
                  ) : (
                    <pre className="text-sm leading-6 py-2 px-3 border-b border-stone-600">
                      {JSON.stringify(item.payload, null, 2)
                        .replace(/\n\s+/g, "\n")
                        .replace(/,/g, "")
                        .replace(/[{}]\n?/g, "")}
                    </pre>
                  )}
                  <div className="flex py-2 px-3 gap-2 justify-between">
                    <pre className="text-xs text-stone-500">idx={idx}</pre>
                    <pre className="text-xs font-semibold">t={item.t}</pre>
                  </div>
                </div>
              );
            })}
            {showHashAndSignature && (
              <div className="p-3 -mt-px rounded min-w-[9.5rem]">
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
  );
}

const userColors: { [user: string]: string } = {
  alice: "text-emerald-500",
  bob: "text-amber-500",
};

function fakeHash(session: { payload: object; t: number }[]) {
  return (
    "hash_z" +
    bs58.encode(
      encoder.encode(
        hashCode(
          session.reduce((acc, item) => acc + JSON.stringify(item), ""),
        ) + "",
      ),
    )
  );
}

function fakeCoID(header: object) {
  return (
    "co_z" + bs58.encode(encoder.encode(hashCode(JSON.stringify(header)) + ""))
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

function fakeEncryptedPayload(payload: object) {
  return (
    "encr_z" +
    bs58.encode(
      encoder.encode(hashCode(JSON.stringify(payload)) + "").slice(0, 6),
    ) +
    "…\n    …" +
    bs58.encode(
      encoder.encode(hashCode(JSON.stringify(payload) + "a") + "").slice(0, 7),
    )
  );
}
