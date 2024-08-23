import { AnchorHTMLAttributes } from "react";
import { ArrowRightIcon, ArrowTopRightIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { Link } from "../ui/link";

interface LinkWithArrowProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  className?: string;
  iconClassName?: string;
}

export const LinkWithArrow = ({
  href,
  children,
  className,
  iconClassName,
}: LinkWithArrowProps) => {
  const isExternal = href.startsWith("http");

  return (
    <Link
      href={href}
      className={clsx(
        isExternal ? "pr-[0.2em]" : "inline-flex items-center gap-[2px]",
        className,
      )}
    >
      {children}
      {isExternal ? (
        <span className="relative">
          <ArrowTopRightIcon
            className={clsx(
              "absolute right-[-0.425em] top-[0.3em] h-[0.45em] w-[0.45em] !no-underline",
              iconClassName,
            )}
          />
        </span>
      ) : (
        <ArrowRightIcon className="translate-y-[0.05em] transform" />
      )}
    </Link>
  );
};
