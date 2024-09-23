import clsx from "clsx";

export function H1({ children }: { children: React.ReactNode }) {
    return (
        <h1
            className={clsx(
                "font-display",
                "text-stone-1000 dark:text-white",
                "text-5xl lg:text-6xl",
                "mb-3",
                "font-medium",
                "tracking-tighter"
            )}
        >
            {children}
        </h1>
    );
}

export function H2({ children }: { children: React.ReactNode }) {
    return (
        <h2
            className={clsx(
                "font-display",
                "text-stone-1000 dark:text-white",
                "text-2xl",
                "mb-2",
                "font-semibold",
                "tracking-tight"
            )}
        >
            {children}
        </h2>
    );
}

export function H3({ children }: { children: React.ReactNode }) {
    return (
        <h3
            className={clsx(
                "font-display",
                "text-stone-1000 dark:text-white",
                "text-xl",
                "mb-2",
                "font-semibold",
                "tracking-tight"
            )}
        >
            {children}
        </h3>
    );
}

export function H4({ children }: { children: React.ReactNode }) {
    return <h4 className="text-bold">{children}</h4>;
}
