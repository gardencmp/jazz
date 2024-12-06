import clsx from "clsx";
import { ReactNode } from "react";
import { H2 } from "../../components/atoms/Headings";

export function GappedGrid({
  children,
  className,
  title,
  cols = 3,
  gap = "md",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  cols?: 3 | 4;
  gap?: "none" | "md";
}) {
  const colsClassName =
    cols === 3
      ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
      : "sm:grid-cols-2 lg:grid-cols-4";

  const gapClassName = {
    none: "gap-0",
    md: "gap-4  lg:gap-8",
  }[gap];

  return (
    <div
      className={clsx(
        "grid",
        colsClassName,
        gapClassName,
        "items-stretch",
        className,
      )}
    >
      {title && <H2 className="col-span-full">{title}</H2>}
      {children}
    </div>
  );
}
