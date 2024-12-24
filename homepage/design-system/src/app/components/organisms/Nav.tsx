"use client";

import {
  CloseButton,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ComponentType,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "../atoms/Icon";
import { SocialLinks, SocialLinksProps } from "./SocialLinks";

type NavItemProps = {
  href: string;
  icon?: string;
  title: string;
  firstOnRight?: boolean;
  newTab?: boolean;
  items?: NavItemProps[];
  description?: string;
};

type NavProps = {
  mainLogo: ReactNode;
  items: NavItemProps[];
  cta?: ReactNode;
  socials?: SocialLinksProps;
  themeToggle: ComponentType<{ className?: string }>;
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
    if (item.icon) {
      return (
        <NavLinkLogo className="px-3" {...item}>
          <Icon name={item.icon} />
          <span className="sr-only">{title}</span>
        </NavLinkLogo>
      );
    }

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
        <Icon name="chevronDown" size="xs" />
      </PopoverButton>

      <PopoverPanel
        transition
        className="absolute left-1/2 -translate-x-1/2 z-10 flex w-screen max-w-[24rem] mt-5 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="flex-auto overflow-hidden rounded-lg ring-1 ring-stone-300/60 bg-white/90 backdrop-blur-lg shadow-lg dark:ring-stone-800/50 dark:bg-stone-925/90">
          <div className="p-3 grid">
            {items.map(({ href, title, description, icon }) => (
              <CloseButton
                className="p-3 rounded-md flex gap-3 hover:bg-stone-100/80 dark:hover:bg-stone-900/80 transition-colors"
                href={href}
                aria-label={title}
                as={Link}
                key={href}
              >
                {icon && (
                  <Icon
                    className="stroke-blue dark:stroke-blue-500 shrink-0"
                    size="sm"
                    name={icon}
                  />
                )}
                <div className="grid gap-1.5 mt-px">
                  <p className="text-sm font-medium text-stone-900 dark:text-white">
                    {title}
                  </p>
                  <p className="text-sm leading-relaxed">{description}</p>
                </div>
              </CloseButton>
            ))}
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  );
}

function MobileNavItem({
  item,
  onClick,
}: { item: NavItemProps; onClick?: () => void }) {
  if (item.items) {
    return (
      <>
        {item.items.map((child) => (
          <MobileNavItem key={child.href} item={child} onClick={onClick} />
        ))}
      </>
    );
  }

  return (
    <NavLink
      className="py-2 px-1"
      href={item.href}
      onClick={onClick}
      newTab={item.newTab}
    >
      {item.title}
    </NavLink>
  );
}

export function MobileNav({
  mainLogo,
  items,
  socials,
  themeToggle: ThemeToggle,
}: NavProps) {
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
      <div className="md:hidden px-4 flex items-center self-stretch dark:text-white border-b">
        <NavLinkLogo prominent href="/" className="mr-auto">
          {mainLogo}
        </NavLinkLogo>
        <button
          className="flex gap-2 p-3 -mr-3 rounded-xl items-center text-stone-900 dark:text-white"
          onMouseDown={() => {
            setMenuOpen((o) => !o);
            setSearchOpen(false);
          }}
          aria-label="Open menu"
        >
          <Icon name="menu" size="lg" />
        </button>
      </div>
      <div
        onClick={() => {
          ``;
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
          "md:hidden fixed flex flex-col bottom-4 right-4 z-40",
          "bg-stone-50 dark:bg-stone-925 border rounded-lg shadow-lg",
          menuOpen || searchOpen ? "left-4" : "",
        )}
      >
        <div className={clsx(menuOpen ? "block" : "hidden", "px-3 pb-2")}>
          <div className="flex items-center w-full border-b">
            <NavLinkLogo
              prominent
              href="/"
              className="mr-auto"
              onClick={() => setMenuOpen(false)}
            >
              {mainLogo}
            </NavLinkLogo>

            <SocialLinks className="px-2 gap-2" {...socials} />
          </div>

          <div className="flex flex-col py-3 border-b">
            {[{ title: "Home", href: "/" }, ...items]
              .filter((item) => !("icon" in item))
              .map((item, i) => (
                <MobileNavItem
                  key={i}
                  onClick={() => setMenuOpen(false)}
                  item={item}
                />
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
              <Icon name="close" />
            ) : (
              <Icon name="menu" />
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
  return (
    <Link
      href={href}
      className={clsx(
        "py-3 hover:text-stone-900 dark:hover:text-white",
        className,
      )}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
    >
      {children}
    </Link>
  );
}

export function Nav(props: NavProps) {
  const { mainLogo, items, cta } = props;
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

          <SocialLinks {...props.socials} />

          {cta}
        </PopoverGroup>
      </div>
      <MobileNav {...props} />
    </>
  );
}
