import { CodeExampleTabs } from "@/components/examples/CodeExampleTabs";
import { ExampleCard } from "@/components/examples/ExampleCard";
import { ExampleLinks } from "@/components/examples/ExampleLinks";
import { ExampleTags } from "@/components/examples/ExampleTags";
import { Example } from "@/lib/example";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";

export function ExampleDemo({ example }: { example: Example }) {
  const { name, slug, tech, features, description, demoUrl, illustration } =
    example;
  const githubUrl = `https://github.com/gardencmp/jazz/tree/main/examples/${slug}`;

  return (
    <GappedGrid
      gap="none"
      className="col-span-full my-12 border bg-stone-50 shadow-sm rounded-lg dark:bg-stone-950 overflow-hidden"
    >
      <div className="p-3 col-span-full flex gap-2 justify-between items-baseline border-b">
        <div className="flex gap-2 items-baseline">
          <h2 className="font-medium text-stone-900 dark:text-white leading-none">
            {name}
          </h2>
          <ExampleTags example={example} />
        </div>

        <ExampleLinks example={example} />
      </div>
      <div className="h-[30rem] border-r overflow-auto col-span-3">
        {example.codeSamples && (
          <CodeExampleTabs tabs={example.codeSamples}></CodeExampleTabs>
        )}
      </div>
      <div className="col-span-3">
        <iframe width="100%" height="100%" src={demoUrl} title={name} />
      </div>
    </GappedGrid>
  );
}
