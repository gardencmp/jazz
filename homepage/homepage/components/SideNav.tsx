import { SideNavHeader } from "@/components/SideNavHeader";
import { SideNavItem } from "@/components/SideNavItem";
import { Framework } from "@/lib/framework";
import { clsx } from "clsx";
import React from "react";

interface SideNavItem {
  name: string;
  href?: string;
  done?:
    | number
    | {
        [key in Framework]: number;
      };
  items?: SideNavItem[];
}
export function SideNav({
  items,
  children,
  footer,
  className,
}: {
  items: SideNavItem[];
  className?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className={clsx(className, "space-y-5")}>
      {children}

      <div className="flex items-center gap-2">
        <span className="inline-block size-2 rounded-full bg-yellow-400"></span>{" "}
        Documentation coming soon
      </div>

      {items.map(({ name, href, items }) => (
        <div key={name}>
          <SideNavHeader href={href}>{name}</SideNavHeader>
          {items &&
            items.map(({ name, href, items, done }) => (
              <ul key={name}>
                <li>
                  <SideNavItem href={href}>
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

      {footer}
    </div>
  );
}
