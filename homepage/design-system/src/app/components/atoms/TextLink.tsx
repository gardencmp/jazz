import clsx from "clsx";
import Link from "next/link";
import { ReactNode } from "react";

export function TextLink({
  href,
  children,
  target,
}: {
  href: string;
  children: ReactNode;
  target?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      className={clsx(
        "underline underline-offset-2",
        "transition-colors hover:transition-none",
        "text-stone-800 dark:text-stone-200",
        "hover:text-black dark:hover:text-white",
        "decoration-stone-300 dark:decoration-stone-700",
        "hover:decoration-stone-800 dark:hover:decoration-stone-200",
      )}
    >
      {children}
    </Link>
  );
}
