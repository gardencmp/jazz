import { clsx } from "clsx";

export function Steps({ children }: { children: React.ReactNode }) {
    return (
        <ol
            style={{ counterReset: "step 0" }}
            className="list-none space-y-2 not-prose"
        >
            {children}
        </ol>
    );
}

export function Step({ children }: { children: React.ReactNode }) {
    return (
        <li
            style={{ counterIncrement: "step 1" }}
            className={clsx(
                "relative pl-10 gap-16 pb-8 prose",
                "before:content-[counter(step)] before:absolute before:rounded-md before:shadow-sm before:ring-1 before:ring-stone-900/5",
                "before:text-[0.625rem] before:font-bold before:text-stone-700",
                "before:left-0 before:w-[calc(1.375rem+1px)] before:h-[calc(1.375rem+1px)]",
                "before:flex before:items-center before:justify-center",
                "dark:before:bg-stone-700 dark:before:text-stone-200 dark:before:ring-0 dark:before:shadow-none dark:before:highlight-white/5",
                "after:absolute after:top-[calc(1.875rem+1px)] after:bottom-0 after:left-[0.6875rem] after:w-px after:bg-stone-200",
                "dark:after:bg-stone-200/5",
            )}
        >
            {children}
        </li>
    );
}
