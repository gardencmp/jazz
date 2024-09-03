import clsx from "clsx";

export function HairlineBleedGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
        "mb-10",
        "items-stretch",
        "gap-[1px]",
        "-mx-4 md:-mx-6",
        "rounded-xl",
        "overflow-hidden",
        // "bg-stone-50 dark:bg-stone-950",
        "bg-canvas",
        "[&>*]:rounded-none",
        "[&>*]:border-none",
        // "[&>*]:bg-stone-100 [&>*]:dark:bg-stone-900"
        "[&>*]:bg-background"
      )}
    >
      {children}
    </div>
  );
}
