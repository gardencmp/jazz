"use client";

import { SideNav } from "@/components/SideNav";
import { SideNavHeader } from "@/components/SideNavHeader";
import { docNavigationItems } from "@/lib/docNavigationItems";
import { useFramework } from "@/lib/framework";
import { clsx } from "clsx";

export function DocNav({ className }: { className?: string }) {
  const framework = useFramework();
  const items = docNavigationItems.map((headerItem) => {
    return {
      ...headerItem,
      items: headerItem.items.map((item) => {
        if (item.href?.startsWith("/docs")) {
          return {
            ...item,
            href: item.href.replace("/docs", `/docs/${framework}`),
            done:
              typeof item.done === "number" ? item.done : item.done[framework],
          };
        }
        return item;
      }),
    };
  });

  return (
    <SideNav items={items} className={clsx(className)}>
      <SideNavHeader href="/api-reference">API Reference</SideNavHeader>
    </SideNav>
  );
}
