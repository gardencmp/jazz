import { Doc } from "@/app/schema";
import { JazzSSRPromise } from "@/app/jazz-server";
import { ClientDoc } from "./clientDoc";
import { ID } from "jazz-tools";

export default async function DocPage({
  params,
}: {
  params: { docId: string };
}) {
  const JazzSSR = await JazzSSRPromise;

  console.log("Loaded ssrJazz");

  const ssrDoc = await Doc.load(params.docId as ID<Doc>, JazzSSR.worker, {});

  console.log("Loaded ssrDoc", ssrDoc);

  if (!ssrDoc) {
    return <div>Doc not found</div>;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div>Doc {params.docId}</div>
        <ClientDoc
          docId={params.docId as ID<Doc>}
          ssrDoc={{ ...ssrDoc } as Doc}
        />
      </main>
    </div>
  );
}
