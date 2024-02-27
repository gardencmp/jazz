import clsx from "clsx";
import { CoID, CoValue } from "cojson";
import { useAutoSub } from "jazz-react";
import { useState } from "react";
import { LinkIcon } from "./link-icon";

export function CoJsonTree({ coValueId }: { coValueId: CoID<CoValue> }) {
  const coValue = useAutoSub(coValueId);

  const values = coValue?.meta.coValue.toJSON() || {};

  return <RenderCoValueJSON json={values} />;
}

function RenderObject({ json }: { json: Record<string, any> }) {
  const [limit, setLimit] = useState(10);
  const hasMore = Object.keys(json).length > limit;

  const entries = Object.entries(json).slice(0, limit);
  return (
    <div className="flex gap-x-1 flex-col font-mono text-xs overflow-auto">
      {entries.map(([key, value]) => {
        return <RenderObjectValue property={key} value={value} />;
      })}
      {hasMore ? (
        <div
          className="text-gray-500 cursor-pointer"
          onClick={() => setLimit((l) => l + 10)}
        >
          ... {Object.keys(json).length - limit} more
        </div>
      ) : null}
    </div>
  );
}

function RenderObjectValue({
  property,
  value,
}: {
  property: string;
  value: any;
}) {
  const [shouldLoad, setShouldLoad] = useState(false);

  const isCoValue =
    typeof value === "string" ? value?.startsWith("co_") : false;

  return (
    <div className={clsx(`flex group`)}>
      <span className="text-gray-500 flex">
        <RenderCoValueJSON json={property} />:{" "}
      </span>

      {isCoValue ? (
        <div className={clsx(shouldLoad && "pb-2")}>
          <div className="flex items-center ">
            <div onClick={() => setShouldLoad((s) => !s)}>
              <div className="w-8 text-center text-gray-700 font-mono px-1 text-xs rounded hover:bg-gray-300 cursor-pointer">
                {shouldLoad ? `-` : `...`}
              </div>
            </div>
            <a href={`#/${value}`} className="ml-2 group-hover:block hidden">
              <LinkIcon />
            </a>
          </div>
          <span>{shouldLoad ? <CoJsonTree coValueId={value} /> : null}</span>
        </div>
      ) : (
        <div className="">
          <RenderCoValueJSON json={value} />
        </div>
      )}
    </div>
  );
}

function RenderCoValueArray({ json }: { json: any[] }) {
  const [limit, setLimit] = useState(10);
  const hasMore = json.length > limit;

  const entries = json.slice(0, limit);
  return (
    <div className="flex gap-x-1 flex-col font-mono text-xs overflow-auto">
      {entries.map((value, idx) => {
        return (
          <div key={idx} className="flex gap-x-1">
            <RenderCoValueJSON json={value} />
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
      <div className="">
        <span className="text-gray-500">[</span>
        <div className="ml-2">
          <RenderCoValueArray json={json} />
        </div>
        <span className="text-gray-500">]</span>
      </div>
    );
  } else if (
    typeof json === "object" &&
    json &&
    Object.getPrototypeOf(json) === Object.prototype
  ) {
    return <RenderObject json={json} />;
  } else if (typeof json === "string") {
    if (json?.startsWith("co_")) {
      return (
        <>
          <a className="underline" href={`#/${json}`}>
            {'"'}
            {json}
            {'"'}
          </a>
        </>
      );
    } else {
      return <div className="truncate max-w-64 ml-1">{json}</div>;
    }
  } else {
    return <div className="truncate max-w-64">{JSON.stringify(json)}</div>;
  }
}
