import { clsx } from "clsx";
import { SideNavHeader } from "@/components/SideNavHeader";
import { SideNavItem } from "@/components/SideNavItem";
import React from "react";

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
    return (
        <div className={clsx(className, "text-sm space-y-5")}>
            {items.map(({ name, href, items }) => (
                <div key={name}>
                    <SideNavHeader href={href}>{name}</SideNavHeader>
                    {items &&
                        items.map(({ name, href, items, done }) => (
                            <ul key={name}>
                                <li>
                                    <SideNavItem href={done === 0 ? undefined : href}>
                                        <span
                                            className={
                                                done === 0 ? "opacity-50" : ""
                                            }
                                        >
                                            {name}
                                        </span>{" "}
                                        {done === undefined ? (
                                            ""
                                        ) : (
                                            <span className="text-xs opacity-50">
                                                ({done}%)
                                            </span>
                                        )}
                                    </SideNavItem>
                                </li>
                                {items && items?.length > 0 && (
                                    <ul className="pl-4">
                                        {items.map(({ name, href }) => (
                                            <li key={href}>
                                                <SideNavItem href={href}>
                                                    {name}
                                                </SideNavItem>
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
