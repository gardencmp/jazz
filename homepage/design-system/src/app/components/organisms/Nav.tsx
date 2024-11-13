"use client";

import clsx from "clsx";
import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../../../components/ui/navigation-menu";
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

export function Nav(props: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { mainLogo, items, docNav, cta } = props;

  useLayoutEffect(() => {
    searchOpen && searchRef.current?.focus();
  }, [searchOpen]);

  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {items.map((item, i) =>
          item.items?.length ? (
            <>
              <NavigationMenuItem key={item.title}>
                <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px]">
                    {item.items.map(({ title, description }) => (
                      <li className="grid gap-1.5 mt-px">
                        <p className="text-sm font-medium text-stone-900 dark:text-white">
                          {title}
                        </p>
                        <p className="text-sm leading-relaxed">{description}</p>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </>
          ) : (
            <NavigationMenuLink asChild>
              <Link href={item.href}>{item.title}</Link>
            </NavigationMenuLink>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );

  return (
    <>
      <nav
        className={[
          clsx(
            "hidden md:flex sticky left-0 right-0 top-0 w-full justify-center",
            "bg-white dark:bg-stone-950 border-b",
            "z-50",
          ),
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center max-sm:justify-between md:gap-2 container w-full">
          <div className="flex items-center flex-shrink">
            <NavLinkLogo prominent href="/" className="-ml-2">
              {mainLogo}
            </NavLinkLogo>
          </div>
          {items.map((item, i) =>
            "icon" in item ? (
              <NavLinkLogo key={i} href={item.href} newTab={item.newTab}>
                {item.icon}
              </NavLinkLogo>
            ) : (
              <NavLink
                key={i}
                href={item.href}
                newTab={item.newTab}
                className={clsx(
                  "max-sm:w-full",
                  item.firstOnRight ? "md:ml-auto" : "",
                )}
              >
                {item.title}
              </NavLink>
            ),
          )}

          {cta}
        </div>
      </nav>
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

          <div className="flex gap-4 justify-end -mb-2">
            {items
              .filter((item) => !("icon" in item))
              .slice(0, 3)
              .map((item, i) => (
                <NavLink
                  key={i}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  newTab={item.newTab}
                >
                  {item.title}
                </NavLink>
              ))}
          </div>

          <div className="flex gap-4 justify-end border-b">
            {items
              .filter((item) => !("icon" in item))
              .slice(3)
              .map((item, i) => (
                <NavLink
                  key={i}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  newTab={item.newTab}
                  className={clsx("")}
                >
                  {item.title}
                </NavLink>
              ))}
          </div>
        </div>
        <div className="flex items-center self-stretch justify-between">
          {/* <input
                        type="text"
                        className={clsx(
                            menuOpen || searchOpen ? "" : "hidden",
                            "ml-2 border px-2 py-1 rounded w-full"
                        )}
                        placeholder="Search docs..."
                        ref={searchRef}
                    /> */}
          {/* <button
                        className="flex p-3 rounded-xl"
                        onClick={() => {
                            setSearchOpen(true);
                        }}
                        onBlur={(e) => {
                            if (!e.currentTarget.value) {
                                setSearchOpen(false);
                            }
                        }}
                    >
                        <SearchIcon className="" />
                    </button> */}
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
        "px-2 lg:px-4 py-3 text-sm",
        className,
        path === href
          ? "font-medium text-black dark:text-white cursor-default"
          : "text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors hover:transition-none",
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
      className={clsx(
        "max-sm:px-4 px-2 lg:px-3 py-3 transition-opacity hover:transition-none",
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
