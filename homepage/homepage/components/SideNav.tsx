"use client";

import { SideNavHeader } from "@/components/SideNavHeader";
import { SideNavItem } from "@/components/SideNavItem";
import { clsx } from "clsx";
import { Search } from "lucide-react";
import React from "react";
import { usePagefindSearch } from "./pagefind";

interface SideNavItem {
  name: string;
  href?: string;
  done?: number;
  items?: SideNavItem[];
}
export function SideNav({
  items,
  children,
  className,
}: {
  items: SideNavItem[];
  className?: string;
  children?: React.ReactNode;
}) {
  const { setOpen } = usePagefindSearch();
  return (
    <div className={clsx(className, "text-sm space-y-5")}>
      <button
        onClick={() => setOpen((open) => !open)}
        className="w-full flex items-center gap-2 px-4 py-2 text-stone-400 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800
          transition-all duration-200 ease-in-out
          hover:border-stone-300 dark:hover:border-stone-700
          hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]
          hover:text-stone-600 dark:hover:text-stone-300"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Quick search...</span>
        <span className="text-xs bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
          ⌘K
        </span>
      </button>

      {items.map(({ name, href, items }) => (
        <div key={name}>
          <SideNavHeader href={href}>{name}</SideNavHeader>
          {items &&
            items.map(({ name, href, items, done }) => (
              <ul key={name}>
                <li>
                  <SideNavItem href={done === 0 ? "/docs/coming-soon" : href}>
                    {done == 0 && (
                      <span className="mr-1.5 inline-block size-2 rounded-full bg-yellow-400"></span>
                    )}

                    <span
                      className={
                        done === 0 ? "text-stone-400 dark:text-stone-600" : ""
                      }
                    >
                      {name}
                    </span>
                  </SideNavItem>
                </li>

                {items && items?.length > 0 && (
                  <ul className="pl-4">
                    {items.map(({ name, href }) => (
                      <li key={href}>
                        <SideNavItem href={href}>{name}</SideNavItem>
                      </li>
                    ))}
                  </ul>
                )}
              </ul>
            ))}
        </div>
      ))}

      {children}
    </div>
  );
}
