"use client";

import { usePathname } from "next/navigation";

export function BreadCrumb({
  items,
}: {
  items: { title: string; href: string }[];
}) {
  const pathName = usePathname();
  const title = items.find((item) => item.href === pathName)?.title;

  if (!title) return null;

  return <span className="text-sm font-semibold">{title}</span>;
}
