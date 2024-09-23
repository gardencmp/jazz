"use client";

import { ID } from "jazz-tools";
import { useCoState } from "../../jazz-client";
import { Doc } from "../../schema";
import { RenderDoc } from "./renderDoc";

export function ClientDoc({ docId, ssrDoc }: { docId: ID<Doc>; ssrDoc: Doc }) {
  const doc = useCoState(Doc, docId);

  return (
    <>
      <RenderDoc doc={doc || ssrDoc} />
      <div>{doc ? "client" : <span className="bg-red">ssr</span>}</div>
    </>
  );
}
