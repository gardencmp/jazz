import { ChatDemo } from "@/components/ChatDemo";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import { Testimonial } from "gcmp-design-system/src/app/components/molecules/Testimonial";

const testimonalProps = {
  name: "Spreadsheet app (stealth)",
  role: "CTO",
};

const TestimonialContent = () => (
  <>
    <p>
      You don&apos;t have to think about deploying a database, SQL schemas,
      relations, and writing queries…
    </p>
    <p>
      Basically,{" "}
      <span className="bg-blue-50 px-1 dark:bg-transparent">
        if you know TypeScript, you know Jazz
      </span>
      , and you can ship an app. It&apos;s just so nice!
    </p>
  </>
);

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

          <Testimonial
            className="hidden lg:block mt-8"
            size="sm"
            {...testimonalProps}
          >
            <TestimonialContent />
          </Testimonial>
        </div>

        <ChatDemo />
      </GappedGrid>

      <Testimonial className="lg:hidden" {...testimonalProps}>
        <TestimonialContent />
      </Testimonial>
    </>
  );
}
