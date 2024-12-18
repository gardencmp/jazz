"use client";

import clsx from "clsx";
import { UseThemeProps } from "next-themes/dist/types";
import { useEffect, useState } from "react";
import { Icon } from "../atoms/Icon";

export function ThemeToggle({
  className,
  resolvedTheme,
  setTheme,
}: { className?: string } & UseThemeProps) {
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
        "md:p-1.5 md:rounded-full md:border",
        "text-stone-400 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white",
        "md:hover:bg-stone-200 md:dark:hover:bg-stone-900",
        "transition-colors",
      )}
      aria-label={mounted ? `Switch to ${otherTheme} theme` : "Toggle theme"}
      onClick={() => setTheme(otherTheme)}
    >
      <Icon
        name="darkTheme"
        size="lg"
        className="size-5 stroke-stone-900 dark:hidden"
      />
      <Icon
        name="lightTheme"
        size="lg"
        className="size-5 hidden stroke-white dark:block"
      />
    </button>
  );
}
