import { ExampleLinks } from "@/components/examples/ExampleLinks";
import { ExampleTags } from "@/components/examples/ExampleTags";
import { Example } from "@/lib/example";
import { clsx } from "clsx";

export function ExampleCard({
  example,
  className,
}: { example: Example; className?: string }) {
  const { name, description, illustration } = example;

  return (
    <div className={clsx(className, "col-span-2 flex flex-col")}>
      {illustration && (
        <div className="mb-3 aspect-[16/9] overflow-hidden w-full rounded-md bg-white border dark:bg-stone-925 sm:aspect-[2/1] md:aspect-[3/2]">
          {illustration}
        </div>
      )}

      <div className="flex-1 space-y-2 mb-2">
        <h2 className="font-medium text-stone-900 dark:text-white leading-none">
          {name}
        </h2>

        <ExampleTags example={example} />

        <p className="text-sm">{description}</p>
      </div>

      <ExampleLinks example={example} />
    </div>
  );
}
