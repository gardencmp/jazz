import clsx from "clsx";
import { CoID, JsonValue, LocalNode, RawCoValue } from "cojson";
import React, { useEffect, useState } from "react";
import { LinkIcon } from "../link-icon";
import {
  isBrowserImage,
  resolveCoValue,
  useResolvedCoValue,
} from "./use-resolve-covalue";

// Is there a chance we can pass the actual CoValue here?
export function ValueRenderer({
  json,
  compact,
  onCoIDClick,
}: {
  json: JsonValue | undefined;
  compact?: boolean;
  onCoIDClick?: (childNode: CoID<RawCoValue>) => void;
}) {
  if (typeof json === "undefined" || json === undefined) {
    return <span className="text-gray-400">undefined</span>;
  }

  if (json === null) {
    return <span className="text-gray-400">null</span>;
  }

  if (typeof json === "string" && json.startsWith("co_")) {
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

  if (typeof json === "string") {
    return (
      <span className="text-green-900 font-mono">
        {/* <span className="select-none opacity-70">{'"'}</span> */}
        {json}
        {/* <span className="select-none opacity-70">{'"'}</span> */}
      </span>
    );
  }

  if (typeof json === "number") {
    return <span className="text-purple-500">{json}</span>;
  }

  if (typeof json === "boolean") {
    return (
      <span
        className={clsx(
          json
            ? "text-green-700 bg-green-700/5"
            : "text-amber-700 bg-amber-500/5",
          "font-mono",
          "inline-block px-1 py-0.5 rounded",
        )}
      >
        {json.toString()}
      </span>
    );
  }

  if (Array.isArray(json)) {
    return (
      <span title={JSON.stringify(json)}>
        Array <span className="text-gray-500">({json.length})</span>
      </span>
    );
  }

  if (typeof json === "object") {
    return (
      <span
        title={JSON.stringify(json, null, 2)}
        className="inline-block max-w-64 truncate"
      >
        {compact ? (
          <span>
            Object{" "}
            <span className="text-gray-500">({Object.keys(json).length})</span>
          </span>
        ) : (
          JSON.stringify(json, null, 2)
        )}
      </span>
    );
  }

  return <span>{String(json)}</span>;
}

export const CoMapPreview = ({
  coId,
  node,
  limit = 6,
}: {
  coId: CoID<RawCoValue>;
  node: LocalNode;
  limit?: number;
}) => {
  const { value, snapshot, type, extendedType } = useResolvedCoValue(
    coId,
    node,
  );

  if (!snapshot) {
    return (
      <div className="rounded bg-gray-100 animate-pulse whitespace-pre w-24">
        {" "}
      </div>
    );
  }

  if (snapshot === "unavailable" && !value) {
    return <div className="text-gray-500">Unavailable</div>;
  }

  if (extendedType === "image" && isBrowserImage(snapshot)) {
    return (
      <div>
        <img
          src={snapshot.placeholderDataURL}
          className="size-8 border-2 border-white drop-shadow-md my-2"
        />
        <span className="text-gray-500 text-sm">
          {snapshot.originalSize[0]} x {snapshot.originalSize[1]}
        </span>

        {/* <CoMapPreview coId={value[]} node={node} /> */}
        {/* <ProgressiveImg image={value}>
                    {({ src }) => <img src={src} className={clsx("w-full")} />}
                </ProgressiveImg> */}
      </div>
    );
  }

  if (extendedType === "record") {
    return (
      <div>
        Record{" "}
        <span className="text-gray-500">({Object.keys(snapshot).length})</span>
      </div>
    );
  }

  if (type === "colist") {
    return (
      <div>
        List{" "}
        <span className="text-gray-500">
          ({(snapshot as unknown as []).length})
        </span>
      </div>
    );
  }

  return (
    <div className="text-sm flex flex-col gap-2 items-start">
      <div className="grid grid-cols-[auto_1fr] gap-2">
        {Object.entries(snapshot)
          .slice(0, limit)
          .map(([key, value]) => (
            <React.Fragment key={key}>
              <span className="font-medium">{key}: </span>
              <span>
                <ValueRenderer json={value} />
              </span>
            </React.Fragment>
          ))}
      </div>
      {Object.entries(snapshot).length > limit && (
        <div className="text-left text-xs text-gray-500 mt-2">
          {Object.entries(snapshot).length - limit} more
        </div>
      )}
    </div>
  );
};

export function AccountOrGroupPreview({
  coId,
  node,
  showId = false,
  onClick,
}: {
  coId: CoID<RawCoValue>;
  node: LocalNode;
  showId?: boolean;
  onClick?: (name?: string) => void;
}) {
  const { snapshot, extendedType } = useResolvedCoValue(coId, node);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (extendedType === "account") {
      resolveCoValue(
        (snapshot as unknown as { profile: CoID<RawCoValue> }).profile,
        node,
      ).then(({ snapshot }) => {
        if (
          typeof snapshot === "object" &&
          "name" in snapshot &&
          typeof snapshot.name === "string"
        ) {
          setName(snapshot.name);
        }
      });
    }
  }, [snapshot, node, extendedType]);

  if (!snapshot) return <span>Loading...</span>;
  if (extendedType !== "account" && extendedType !== "group") {
    return <span>CoID is not an account or group</span>;
  }

  const displayName = extendedType === "account" ? name || "Account" : "Group";
  const displayText = showId ? `${displayName} (${coId})` : displayName;

  const props = onClick
    ? {
        onClick: () => onClick(displayName),
        className: "text-blue-500 cursor-pointer hover:underline",
      }
    : {
        className: "text-gray-500",
      };

  return <span {...props}>{displayText}</span>;
}
