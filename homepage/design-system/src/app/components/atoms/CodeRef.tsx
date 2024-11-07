import clsx from "clsx";

export function CodeRef({ children }: { children: React.ReactNode }) {
  return (
    <code
      className={clsx(
        "font-mono",
        "text-[0.9em]",
        "px-2 py-1",
        "rounded",
        "text-stone-900 dark:text-stone-200",
        "bg-stone-100 dark:bg-stone-800",
      )}
    >
      {children}
    </code>
  );
}
