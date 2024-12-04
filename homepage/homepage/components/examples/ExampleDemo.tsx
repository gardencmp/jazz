import { CodeExampleTabs } from "@/components/examples/CodeExampleTabs";
import { ExampleLinks } from "@/components/examples/ExampleLinks";
import { ExampleTags } from "@/components/examples/ExampleTags";
import { Example } from "@/lib/example";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";

export function ExampleDemo({ example }: { example: Example }) {
  const { name, demoUrl, illustration } = example;

  return (
    <GappedGrid
      gap="none"
      className="border bg-stone-50 shadow-sm rounded-lg dark:bg-stone-950 overflow-hidden"
    >
      <div className="p-3 col-span-full flex flex-col gap-2 justify-between items-baseline border-b sm:flex-row">
        <div className="flex flex-col gap-2 items-baseline sm:flex-row">
          <h2 className="font-medium text-stone-900 dark:text-white leading-none">
            {name}
          </h2>
          <ExampleTags example={example} />
        </div>

        <ExampleLinks example={example} />
      </div>
      <div className="h-[25rem] lg:h-[30rem] border-t overflow-auto col-span-full md:col-span-2 lg:col-span-3 order-last md:order-none md:border-r md:border-t-0">
        {example.codeSamples && (
          <CodeExampleTabs tabs={example.codeSamples}></CodeExampleTabs>
        )}
      </div>
      <div className="col-span-full md:p-8 md:col-span-2 lg:col-span-3 h-[25rem] lg:h-[30rem] lg:p-12">
        <iframe
          width="100%"
          height="100%"
          className="md:rounded-lg md:shadow-lg"
          src={demoUrl}
          title={name}
        />
      </div>
    </GappedGrid>
  );
}
