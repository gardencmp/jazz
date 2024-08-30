import clsx from "clsx";

export function CodeRef({ children }: { children: React.ReactNode }) {
    return (
        <code
            className={clsx(
                "font-mono",
                "text-[0.9em]",
                "px-1 py-0.5",
                "rounded-sm",
                "border",
                "text-stone-800 dark:text-stone-200",
                "bg-stone-100 dark:bg-stone-800",
                "border-stone-200 dark:border-stone-800"
            )}
        >
            {children}
        </code>
    );
}
