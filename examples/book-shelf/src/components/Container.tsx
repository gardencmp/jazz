import clsx from "clsx";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto max-w-4xl px-4", className)}>{children}</div>
  );
}
