import { clsx } from "clsx";
import Link from "next/link";
import { forwardRef } from "react";
import { Icon } from "../atoms/Icon";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "sm" | "md" | "lg";
  href?: string;
  newTab?: boolean;
  icon?: string;
  loading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

function ButtonIcon({ icon, loading }: ButtonProps) {
  if (!Icon) return null;

  const className = "size-5";

  if (loading) return <Spinner className={className} />;

  if (icon) {
    return <Icon name={icon} className={className} />;
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      size = "md",
      variant = "primary",
      href,
      disabled,
      newTab,
      loading,
      loadingText,
      icon,
      ...buttonProps
    },
    ref,
  ) => {
    const sizeClasses = {
      sm: "text-sm py-1 px-2",
      md: "py-1.5 px-3",
      lg: "md:text-lg  py-2 px-3 md:px-8 md:py-3",
    };

    const variantClasses = {
      primary:
        "bg-blue border-blue text-white font-medium bg-blue hover:bg-blue-800 hover:border-blue-800",
      secondary:
        "text-stone-900 border font-medium hover:border-stone-300 hover:dark:border-stone-700 dark:text-white",
      tertiary: "text-blue underline underline-offset-4",
    };

    const classNames = clsx(
      className,
      "inline-flex items-center justify-center gap-2 rounded-lg text-center transition-colors",
      "disabled:pointer-events-none disabled:opacity-70",
      sizeClasses[size],
      variantClasses[variant],
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
    );

    if (href) {
      return (
        <Link
          href={href}
          target={newTab ? "_blank" : undefined}
          className={classNames}
        >
          <ButtonIcon icon={icon} loading={loading} />
          {children}
          {newTab ? (
            <span className="inline-block text-stone-300 dark:text-stone-700 relative -top-0.5 -left-2 -mr-2">
              ⌝
            </span>
          ) : (
            ""
          )}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        {...buttonProps}
        disabled={disabled || loading}
        className={classNames}
      >
        <ButtonIcon icon={icon} loading={loading} />

        {loading && loadingText ? loadingText : children}
      </button>
    );
  },
);
