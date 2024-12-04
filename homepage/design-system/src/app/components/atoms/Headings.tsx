import clsx from "clsx";

interface HeadingProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function H1({ children, className, id }: HeadingProps) {
  return (
    <h1
      id={id}
      className={clsx(
        className,
        "font-display",
        "text-stone-950 dark:text-white",
        "text-5xl lg:text-6xl",
        "mb-3",
        "font-medium",
        "tracking-tighter",
      )}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className, id }: HeadingProps) {
  return (
    <h2
      id={id}
      className={clsx(
        className,
        "font-display",
        "text-stone-950 dark:text-white",
        "text-2xl md:text-4xl",
        "mb-2",
        "font-semibold",
        "tracking-tight",
      )}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className, id }: HeadingProps) {
  return (
    <h3
      id={id}
      className={clsx(
        className,
        "font-display",
        "text-stone-950 dark:text-white",
        "text-xl md:text-2xl",
        "mb-2",
        "font-semibold",
        "tracking-tight",
      )}
    >
      {children}
    </h3>
  );
}

export function H4({ children, className, id }: HeadingProps) {
  return (
    <h4 id={id} className={clsx(className, "text-bold")}>
      {children}
    </h4>
  );
}

export function Kicker({ children, className }: HeadingProps) {
  return (
    <p
      className={clsx(
        className,
        "uppercase text-blue tracking-widest text-sm font-medium dark:text-stone-400",
      )}
    >
      {children}
    </p>
  );
}
