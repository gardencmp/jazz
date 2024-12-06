"use client";

import { ThemeWatcher } from "gcmp-design-system/src/app/components/molecules/ThemeWatcher";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import * as React from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const useThemeProps = useTheme();
  return (
    <NextThemesProvider {...props}>
      <ThemeWatcher {...useThemeProps} />
      {children}
    </NextThemesProvider>
  );
}
