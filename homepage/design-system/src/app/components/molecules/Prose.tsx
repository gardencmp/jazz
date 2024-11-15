import clsx from "clsx";
import { ReactNode } from "react";

export function Prose({
  children,
  className,
  size = "md",
}: {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClassName = {
    sm: "prose-sm",
    md: "",
    lg: "prose-lg lg:prose-xl",
  }[size];

  return (
    <div
      className={clsx(
        className,
        "prose",
        sizeClassName,
        "dark:prose-invert",
        "prose-code:dark:bg-stone-900",
      )}
    >
      {children}
    </div>
  );
}

export function SmallProse(props: { children: ReactNode; className?: string }) {
  return <Prose className="prose prose-sm">{props.children}</Prose>;
}
