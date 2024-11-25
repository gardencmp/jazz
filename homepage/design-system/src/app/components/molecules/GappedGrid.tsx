import clsx from "clsx";
import { ReactNode } from "react";
import { H2 } from "../../components/atoms/Headings";

export function GappedGrid({
  children,
  className,
  title,
  cols = 3,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  cols?: 3 | 4;
}) {
  const colsClassName =
    cols === 3
      ? "md:grid-cols-4 lg:grid-cols-6"
      : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div
      className={clsx(
        "grid grid-cols-2 gap-4 lg:gap-8",
        colsClassName,
        "items-stretch",
        className,
      )}
    >
      {title && <H2 className="col-span-full">{title}</H2>}
      {children}
    </div>
  );
}
