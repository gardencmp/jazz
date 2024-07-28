import { CoID, LocalNode, RawCoValue } from "cojson";
import { JsonObject } from "cojson/src/jsonValue";
import { CoMapPreview, ValueRenderer } from "./value-renderer";
import clsx from "clsx";
import { PageInfo, isCoId } from "./types";
import { ResolveIcon, TypeIcon } from "./type-icon";

export function GridView({
    data,
    onNavigate,
    node,
}: {
    data: JsonObject;
    onNavigate: (pages: PageInfo[]) => void;
    node: LocalNode;
}) {
    const entries = Object.entries(data);

    const cellClassName = "truncate px-2 py-5 align-top";

    return (
        <>
            {/* <table className="w-full border-collapse text-sm -mx-2">
        <tbody className="divide-y divide-gray-200">
          {entries.map(([key, child], childIndex) => (
            <tr key={childIndex} className="align-top py-6">
              <td
                className={cellClassName}
                style={{ maxWidth: "200px", width: "1%" }}
              >
                {isCoId(child) ? (
                  <span className={clsx("font-medium")}>{key}</span>
                ) : (
                  <span>{key}</span>
                )}
              </td>
              <td className={cellClassName}>
                {isCoId(child) ? (
                  <div
                    className="border rounded-lg p-3 shadow-sm cursor-pointer inline-block leading-10"
                    onClick={() =>
                      onNavigate([
                        { coId: child as CoID<RawCoValue>, name: key },
                      ])
                    }
                  >
                    <CoMapPreview
                      coId={child as CoID<RawCoValue>}
                      node={node}
                    />
                  </div>
                ) : (
                  <ValueRenderer
                    json={child}
                    onCoIDClick={(coId) => {
                      onNavigate([{ coId, name: key }]);
                    }}
                    compact
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table> */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                {/* Adapt this to work */}
                {entries.map(([key, child], childIndex) => (
                    <div
                        key={childIndex}
                        className={clsx(
                            "bg-gray-100 p-3 rounded-lg transition-colors overflow-hidden",
                            isCoId(child)
                                ? "bg-white border hover:bg-gray-100/5 cursor-pointer shadow-sm"
                                : "bg-gray-50",
                        )}
                        onClick={() =>
                            isCoId(child) &&
                            onNavigate([
                                { coId: child as CoID<RawCoValue>, name: key },
                            ])
                        }
                    >
                        <h3 className="truncate">
                            {isCoId(child) ? (
                                <span className="font-medium flex justify-between">
                                    {key}

                                    <div className="px-2 py-1 text-xs bg-gray-100 rounded-md">
                                        <ResolveIcon
                                            coId={child as CoID<RawCoValue>}
                                            node={node}
                                        />
                                    </div>
                                </span>
                            ) : (
                                <span>{key}</span>
                            )}
                        </h3>
                        <div className="mt-2 text-sm">
                            {isCoId(child) ? (
                                <CoMapPreview
                                    coId={child as CoID<RawCoValue>}
                                    node={node}
                                />
                            ) : (
                                <ValueRenderer
                                    json={child}
                                    onCoIDClick={(coId) => {
                                        onNavigate([{ coId, name: key }]);
                                    }}
                                    compact
                                />
                            )}
                        </div>
                    </div>
                ))}

                {/* {coIds.map((child, childIndex) => (
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
         ))} */}
            </div>
        </>
    );
}
