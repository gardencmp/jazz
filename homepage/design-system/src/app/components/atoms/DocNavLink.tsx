import Link from "next/link";
import { ReactNode } from "react";

export function DocNavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="hover:text-black dark:hover:text-white py-1 hover:transition-colors"
    >
      {children}
    </Link>
  );
}
