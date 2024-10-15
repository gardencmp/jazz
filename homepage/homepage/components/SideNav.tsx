import { clsx } from "clsx";
import { SideNavHeader } from "@/components/SideNavHeader";
import { SideNavItem } from "@/components/SideNavItem";
import React from "react";

interface SideNavItem {
    name: string;
    href?: string;
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
                        items.map(({ name, href, items }) => (
                            <ul key={name}>
                                <li>
                                    <SideNavItem href={href}>
                                        {name}
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
