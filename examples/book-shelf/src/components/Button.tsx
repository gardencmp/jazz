import Link from "next/link";
import type { ComponentProps } from "react";
import clsx from "clsx";

interface Props {
  variant?: "primary" | "secondary" | "tertiary";
  className?: string;
  size?: "sm" | "md" | "lg";
}

interface AnchorProps
  extends Props,
    React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

type ButtonProps = ComponentProps<"button"> & Props;

export function Button(props: AnchorProps | ButtonProps) {
  const {
    className: customClassName = "",
    variant = "primary",
    children,
    size = "md",
  } = props;

  const variantClassNames = {
    base: "inline-flex gap-2 items-center justify-center rounded-full overflow-hidden transition-colors",
    primary:
      "bg-purple-300 font-medium text-purple-950 px-4 py-2 rounded-full hover:bg-purple-200",
    secondary:
      "rounded-full bg-slate-100 font-medium text-slate-600 hover:bg-slate-200",
    tertiary: "rounded-full bg-white text-purple-950 font-medium",
  };

  const sizeClassNames = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2 px-5",
    lg: "py-2 md:py-2.5 px-6 md:text-lg",
  };

  const className = clsx(
    customClassName,
    variantClassNames.base,
    variantClassNames[variant],
    sizeClassNames[size]
  );

  if (!!(props as AnchorProps).href) {
    const anchorProps = props as AnchorProps;
    return (
      <Link href={anchorProps.href} className={className}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonProps;

  return (
    <button {...buttonProps} className={className}>
      {children}
    </button>
  );
}
