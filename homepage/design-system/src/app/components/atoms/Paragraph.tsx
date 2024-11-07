import clsx from "clsx";

export function P({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={clsx(className, "mb-4")}>{children}</p>;
}
