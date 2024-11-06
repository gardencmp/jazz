import clsx from "clsx";

export function HairlineBleedGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={clsx(
        "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
        "items-stretch",
        "gap-px",
        "rounded-xl",
        "overflow-hidden",
        "bg-stone-50 dark:bg-stone-950",
        "[&>*]:rounded-none",
        "[&>*]:border-none",
        "[&>*]:bg-stone-100 [&>*]:dark:bg-stone-900",
      )}
    >
      {children}
    </div>
  );
}
