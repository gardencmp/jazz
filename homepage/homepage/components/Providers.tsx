"use client";

import { FrameworkContext } from "@/context/FrameworkContext";

export function Providers({
  framework,
  children,
}: { framework: string; children: React.ReactNode }) {
  return (
    <FrameworkContext.Provider value={framework}>
      {children}
    </FrameworkContext.Provider>
  );
}
