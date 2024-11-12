import { ChatDemo } from "@/components/ChatDemo";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";

export function CodeExampleSection() {
  return (
    <div>
      <SectionHeader
        title="See it for yourself"
        slogan="A chat app in 174 lines of code."
      />
      <ChatDemo />
    </div>
  );
}
