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
      <ResponsiveIframe
        src="https://chat.jazz.tools"
        src2="https://jazz-chat-2.vercel.app/"
        localsrc="http://localhost:5173"
        localsrc2="http://localhost:5174"
      />
    </div>
  );
}
