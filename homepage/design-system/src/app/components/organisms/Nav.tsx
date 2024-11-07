"use client";

import {
  CloseButton,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import clsx from "clsx";
import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BreadCrumb } from "../molecules/Breadcrumb";
import { ThemeToggle } from "../molecules/ThemeToggle";

type NavItemProps = {
  href: string;
  icon?: ReactNode;
  title: string;
  firstOnRight?: boolean;
  newTab?: boolean;
  items?: NavItemProps[];
  description?: string;
};

type NavProps = {
  mainLogo: ReactNode;
  items: NavItemProps[];
  docNav?: ReactNode;
  cta?: ReactNode;
};

function NavItem({
  item,
  className,
}: {
  item: NavItemProps;
  className?: string;
}) {
  const { href, icon, title, items, firstOnRight } = item;

  const path = usePathname();

  if (!items?.length) {
    return (
      <NavLink
        className={clsx(
          className,
          "text-sm px-2 lg:px-4 py-3 ",
          firstOnRight && "ml-auto",
          path === href ? "text-black dark:text-white" : "",
        )}
        {...item}
      >
        {title}
      </NavLink>
    );
  }

  return (
    <Popover className={clsx("relative", className, firstOnRight && "ml-auto")}>
      <PopoverButton
        className={clsx(
          "flex items-center gap-1.5 text-sm px-2 lg:px-4 py-3 max-sm:w-full text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors hover:transition-none focus-visible:outline-none",
          path === href ? "text-black dark:text-white" : "",
        )}
      >
        <span>{title}</span>
        <ChevronDownIcon aria-hidden="true" className="size-4" />
      </PopoverButton>

      <PopoverPanel
        transition
        className="absolute left-1/2 -translate-x-1/2 z-10 flex w-screen max-w-[16rem] transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="w-screen max-w-md flex-auto overflow-hidden rounded-lg border bg-white shadow-lg dark:bg-stone-925">
          <div className="p-2 grid">
            {items.map(({ href, title, description, icon }) => (
              <CloseButton
                className="p-2 rounded flex gap-2 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
                href={href}
                aria-label={title}
                as={Link}
              >
                {icon}
                <div className="grid gap-1 mt-px">
                  <div className="text-sm font-medium text-stone-900 dark:text-white">
                    {title}
                  </div>
                  <p className="text-xs leading-relaxed">{description}</p>
                </div>
              </CloseButton>
            ))}
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  );
}

export function MobileNav({ mainLogo, items, docNav, cta }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    searchOpen && searchRef.current?.focus();
  }, [searchOpen]);

  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="md:hidden px-4 flex items-center self-stretch dark:text-white">
        <NavLinkLogo prominent href="/" className="mr-auto">
          {mainLogo}
        </NavLinkLogo>
        <button
          className="flex gap-2 p-3 rounded-xl items-center"
          onMouseDown={() => {
            setMenuOpen((o) => !o);
            setSearchOpen(false);
          }}
          aria-label="Open menu"
        >
          <MenuIcon />
          <BreadCrumb items={items} />
        </button>
      </div>
      <div
        onClick={() => {
          setMenuOpen(false);
          setSearchOpen(false);
        }}
        className={clsx(
          menuOpen || searchOpen ? "block" : "hidden",
          "fixed top-0 bottom-0 left-0 right-0 bg-stone-200/80 dark:bg-black/80 w-full h-full z-20",
        )}
      ></div>
      <nav
        className={clsx(
          "md:hidden fixed flex flex-col bottom-4 right-4 z-50",
          "bg-stone-50 dark:bg-stone-925 border rounded-lg shadow-lg",
          menuOpen || searchOpen ? "left-4" : "",
        )}
      >
        <div className={clsx(menuOpen ? "block" : "hidden", " px-2 pb-2")}>
          <div className="flex items-center w-full border-b">
            <NavLinkLogo
              prominent
              href="/"
              className="mr-auto"
              onClick={() => setMenuOpen(false)}
            >
              {mainLogo}
            </NavLinkLogo>
            {items
              .filter((item) => "icon" in item)
              .map((item, i) => (
                <NavLinkLogo key={i} href={item.href} newTab={item.newTab}>
                  {item.icon}
                </NavLinkLogo>
              ))}
          </div>

          {pathname.startsWith("/docs") && docNav && (
            <div className="max-h-[calc(100dvh-15rem)] p-4 border-b overflow-x-auto">
              {docNav}
            </div>
          )}

          <div className="flex flex-wrap justify-end py-2 gap-x-3 gap-y-1 border-b">
            {[{ title: "Home", href: "/" }, ...items]
              .filter((item) => !("icon" in item))
              .map((item, i) => (
                <NavLink
                  className="p-1 text-sm"
                  key={i}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  newTab={item.newTab}
                >
                  {item.title}
                </NavLink>
              ))}
          </div>
        </div>
        <div className="flex items-center self-stretch justify-between">
          {(menuOpen || searchOpen) && <ThemeToggle className="p-3" />}
          <button
            className="flex gap-2 p-3 rounded-xl items-center"
            onMouseDown={() => {
              setMenuOpen((o) => !o);
              setSearchOpen(false);
            }}
            aria-label="Close menu"
          >
            {menuOpen || searchOpen ? (
              <XIcon />
            ) : (
              <>
                <MenuIcon />
                <BreadCrumb items={items} />
              </>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}

function NavLink({
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

  return (
    <Link
      href={href}
      className={clsx(
        "text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors hover:transition-none",
        className,
      )}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
    >
      {children}
      {newTab ? (
        <span className="inline-block text-stone-300 dark:text-stone-700 relative -top-0.5 -left-0.5 -mr-2">
          ⌝
        </span>
      ) : (
        ""
      )}
    </Link>
  );
}

function NavLinkLogo({
  href,
  className,
  children,
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
      className={clsx("py-3", className)}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
    >
      {children}
    </Link>
  );
}

export function Nav(props: NavProps) {
  const { mainLogo, items, docNav, cta } = props;
  return (
    <>
      <div className="w-full border-b py-2 sticky top-0 z-50 bg-white dark:bg-stone-950 hidden md:block">
        <PopoverGroup className="flex flex-wrap items-center max-sm:justify-between md:gap-2 container w-full">
          <Link href="/" className="flex items-center">
            {mainLogo}
          </Link>

          {items.map((item, i) => (
            <NavItem
              key={i}
              item={item}
              className={i == items.length - 1 ? "mr-3" : ""}
            />
          ))}

          {cta}
        </PopoverGroup>
      </div>
      <MobileNav {...props} />
    </>
  );
}
