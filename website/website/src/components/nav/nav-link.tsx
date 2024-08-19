import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import clsx from "clsx";

export function NavLink({
  href,
  className,
  children,
  onClick,
  newTab,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  newTab?: boolean;
}) {
  const path = usePathname();
  // console.log(path);
  const isActive = path === href || (href !== "/" && path.startsWith(href));

  return (
    <Link
      href={href}
      className={clsx(
        "NavLink",
        buttonVariants({ variant: "ghost", size: "sm" }),
        "text-small font-medium !justify-start max-sm:w-full",
        // before:absolute before:-inset-[0.25em];
        className,
        isActive
          ? "text-accent" // cursor-default bg-accent-background
          : "hover:text-fill-contrast transition-colors hover:transition-none",
      )}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
    >
      {children}
      {newTab ? (
        <span className="inline-block text-current relative -top-0.5 -left-0.5 -mr-2">
          ⌝
        </span>
      ) : (
        ""
      )}
    </Link>
  );
}

export function NavLinkLogo({
  href,
  className,
  children,
  prominent,
  onClick,
  newTab,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  prominent?: boolean;
  onClick?: () => void;
  newTab?: boolean;
}) {
  const path = usePathname();

  return (
    <Link
      href={href}
      target={newTab ? "_blank" : undefined}
      onClick={onClick}
      className={cn(
        "NavLinkLogo",
        buttonVariants({ variant: "ghost", size: "sm" }),
        "px-0 !text-fill-contrast hover:bg-transparent",
        path === href
          ? "cursor-default"
          : prominent
            ? ""
            : "opacity-60 hover:opacity-100",
        className,
      )}
    >
      {children}
    </Link>
  );
}
