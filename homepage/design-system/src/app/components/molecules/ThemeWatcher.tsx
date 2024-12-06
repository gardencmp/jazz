import { UseThemeProps } from "next-themes/dist/types";
import { useEffect } from "react";

export function ThemeWatcher({ resolvedTheme, setTheme }: UseThemeProps) {
  useEffect(() => {
    let media = window.matchMedia("(prefers-color-scheme: dark)");

    function onMediaChange() {
      let systemTheme = media.matches ? "dark" : "light";
      if (resolvedTheme === systemTheme) {
        setTheme("system");
      }
    }

    onMediaChange();
    media.addEventListener("change", onMediaChange);

    return () => {
      media.removeEventListener("change", onMediaChange);
    };
  }, [resolvedTheme, setTheme]);

  return null;
}
