"use client";

// import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ThemeProvider as NextThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class">
      {/* <TooltipProvider>{children}</TooltipProvider> */}
      {children}
    </NextThemeProvider>
  );
}
