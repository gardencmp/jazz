"use client";

import { usePathname } from "next/navigation";

export function BreadCrumb({
    items,
}: {
    items: { title: string; href: string }[];
}) {
    const pathName = usePathname();

    return (
        <span className="text-sm font-bold">
            {items.find((item) => item.href === pathName)?.title}
        </span>
    );
}
