import { SideNav } from "@/components/SideNav";
import { SideNavHeader } from "@/components/SideNavHeader";
import { docNavigationItems } from "@/lib/docNavigationItems";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function DocNav({ className }: { className?: string }) {
  return (
    <SideNav
      items={docNavigationItems}
      className={clsx(
        twMerge(
          "pr-3 md:col-span-4 lg:col-span-3",
          "sticky align-start top-[4.75rem] h-[calc(100vh-108px)] overflow-y-auto overflow-x-hidden",
          "hidden md:block",
          className,
        ),
      )}
    >
      <SideNavHeader href="/docs/api-reference">API Reference</SideNavHeader>
    </SideNav>
  );
}
