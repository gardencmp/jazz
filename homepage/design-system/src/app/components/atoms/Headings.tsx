import clsx from "clsx";

export function H1({ children }: { children: React.ReactNode }) {
    return (
        <h1
            className={clsx(
                "font-display",
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