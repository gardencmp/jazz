import {
  App_tsx,
  ChatScreen_tsx,
  Main_tsx,
  Schema_ts,
  Ui_tsx,
} from "@/codeSamples/examples/chat/src";
import { CodeExampleTabs, ResponsiveIframe } from "@/components/forMdx";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";

export function CodeExampleSection() {
  return (
    <div>
      <SectionHeader
        title="See it for yourself"
        slogan="A chat app in 174 lines of code."
      />

      <div className="flex flex-col md:grid md:grid-cols-2 md:divide-x border rounded-sm overflow-hidden shadow-sm dark:divide-stone-900">
        <CodeExampleTabs
          tabs={[
            {
              name: "main.tsx",
              content: <Main_tsx />,
            },
            {
              name: "app.tsx",
              content: <App_tsx />,
            },
            {
              name: "schema.ts",
              content: <Schema_ts />,
            },
            {
              name: "chatScreen.tsx",
              content: <ChatScreen_tsx />,
            },
            {
              name: "ui.tsx",
              content: <Ui_tsx />,
            },
          ]}
        />
        <div className="border-b order-first md:order-last flex flex-col md:border-b-0">
          <div className="flex border-b overflow-x-auto overflow-y-hidden bg-white dark:bg-stone-900">
            <p className="items-center -mb-px transition-colors px-3 pb-1.5 pt-2 block text-xs border-b-2 border-blue-700 text-stone-700 dark:bg-stone-925 dark:text-blue-500 dark:border-blue-500">
              result
            </p>
          </div>
          <ResponsiveIframe
            src="https://chat.jazz.tools"
            localsrc="http://localhost:5173"
          />
        </div>
      </div>
    </div>
  );
}
