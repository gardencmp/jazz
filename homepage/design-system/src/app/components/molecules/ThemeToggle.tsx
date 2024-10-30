"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import clsx from "clsx";

export function ThemeToggle({ className }: { className?: string }) {
    let { resolvedTheme, setTheme } = useTheme();
    let otherTheme = resolvedTheme === "dark" ? "light" : "dark";
    let [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <button
            type="button"
            className={clsx(
                className,
                "md:p-2 md:rounded-full md:border",
                "text-stone-400 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white",
                "md:hover:bg-stone-200 md:dark:hover:bg-stone-900",
                "transition-colors"
            )}
            aria-label={
                mounted ? `Switch to ${otherTheme} theme` : "Toggle theme"
            }
            onClick={() => setTheme(otherTheme)}
        >
            <MoonIcon
                size={24}
                strokeWidth={1.5}
                className="size-5 md:size-6 stroke-stone-900 dark:hidden"
            />
            <SunIcon
                size={24}
                strokeWidth={1.5}
                className="size-5 md:size-6 hidden stroke-white dark:block"
            />
        </button>
    );
}
