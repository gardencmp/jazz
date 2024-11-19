import { ChatDemo } from "@/components/ChatDemo";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import { Testimonial } from "gcmp-design-system/src/app/components/molecules/Testimonial";

export function ChatDemoSection() {
  return (
    <>
      <GappedGrid className="gap-y-8">
        <div className="col-span-2 md:col-span-full lg:col-span-2">
          <div>
            <SectionHeader
              kicker="Demo"
              title="See it for yourself"
              slogan="A chat app in 174 lines of client-side code."
            />

            <Button
              href="https://github.com/gardencmp/jazz/tree/main/examples/chat"
              variant="secondary"
            >
              View code
            </Button>
          </div>
        </div>

        <ChatDemo />
      </GappedGrid>
    </>
  );
}
