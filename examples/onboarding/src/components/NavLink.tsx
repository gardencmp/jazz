import React from "react";
import { Link } from "react-router-dom";

export function NavLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
      to={to}
    >
      {children}
    </Link>
  );
}
