"use client";

import { FrameworkContext } from "@/context/FrameworkContext";
import { Framework } from "@/lib/framework";

export function Providers({
  framework,
  children,
}: { framework: Framework; children: React.ReactNode }) {
  return (
    <FrameworkContext.Provider value={framework}>
      {children}
    </FrameworkContext.Provider>
  );
}
