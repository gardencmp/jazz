import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/components/ui/link";

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
      className={cn(
        "NavLink",
        buttonVariants({ variant: "ghost", size: "sm" }),
        "text-sm max-sm:w-full",
        // before:absolute before:-inset-[0.25em];
        className,
        isActive
          ? "font-medium text-accent cursor-default" // bg-accent-background
          : "text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors hover:transition-none",
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
      className={cn(
        "NavLinkLogo",
        buttonVariants({ variant: "ghost", size: "sm" }),
        "px-0 !text-fill-contrast hover:bg-transparent",
        // "max-sm:px-4 px-2 lg:px-3 py-3",
        // "transition-opacity hover:transition-none",
        path === href
          ? "cursor-default"
          : prominent
            ? "hover:opacity-50"
            : "opacity-60 hover:opacity-100",
        "text-black dark:text-white",
        className,
      )}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
    >
      {children}
    </Link>
  );
}
