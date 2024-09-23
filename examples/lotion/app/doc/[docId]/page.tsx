import { Doc } from "@/app/schema";
import { createJazzContext, fixedCredentialsAuth, ID, WasmCrypto } from "jazz-tools";
import { ClientDoc } from "./clientDoc";
import { hardcodedUserCredentials } from "@/app/hardcodedUserCredentials";
import { randomSessionProvider } from "jazz-tools";

export default async function DocPage({ params }: { params: { docId: string } }) {
  const ssrJazz = await createJazzContext({
    auth: fixedCredentialsAuth(hardcodedUserCredentials),
    sessionProvider: randomSessionProvider,
    peersToLoadFrom: [

    ],
    crypto: await WasmCrypto.create()
  })

  const ssrDoc = await Doc.load(params.docId as ID<Doc>, ssrJazz.account, {});

  if (!ssrDoc) {
    return <div>Doc not found</div>;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div>Doc {params.docId}</div>
        <ClientDoc docId={params.docId as ID<Doc>} ssrDoc={ssrDoc} />
      </main>
    </div>
  );
}
