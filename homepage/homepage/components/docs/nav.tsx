import { SideNav } from "@/components/SideNav";
import { SideNavHeader } from "@/components/SideNavHeader";
import { docNavigationItems } from "@/lib/docNavigationItems";
import { clsx } from "clsx";

export function DocNav({ className }: { className?: string }) {
  return (
    <SideNav items={docNavigationItems} className={clsx(className)}>
      <SideNavHeader href="/api-reference">API Reference</SideNavHeader>
    </SideNav>
  );
}
