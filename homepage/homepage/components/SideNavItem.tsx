"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function SideNavItem({
  href,
  children,
  className = "",
}: {
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  const classes = clsx(
    className,
    "py-1 flex items-center hover:transition-colors",
  );
  const path = usePathname();

  if (href) {
    return (
      <Link
        href={href}
        className={clsx(
          classes,
          href &&
            "hover:text-stone-900 dark:hover:text-stone-200 transition-colors hover:transition-none",
          {
            "text-stone-900 dark:text-white": path === href,
          },
        )}
      >
        {children}
      </Link>
    );
  }

  return <p className={classes}>{children}</p>;
}
