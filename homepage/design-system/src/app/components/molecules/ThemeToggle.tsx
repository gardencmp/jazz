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
                "transition-opacity hover:transition-none opacity-60 hover:opacity-100 text-black dark:text-white",
            )}
            aria-label={
                mounted ? `Switch to ${otherTheme} theme` : "Toggle theme"
            }
            onClick={() => setTheme(otherTheme)}
        >
            <MoonIcon
                size={20}
                className="h-5 w-5 stroke-zinc-900 dark:hidden"
            />
            <SunIcon
                size={20}
                className="hidden h-5 w-5 stroke-white dark:block"
            />
        </button>
    );
}
