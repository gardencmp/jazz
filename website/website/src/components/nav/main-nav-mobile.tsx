"use client";

import { JazzLogo } from "@/components/logos";
import { cn } from "@/lib/utils";
import clsx from "clsx";
import { MenuIcon, XIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { BreadCrumb } from "./breadcrumb";
import { primaryItems, secondaryItems, socialLinks } from "./main-nav-data";
import { NavLink, NavLinkLogo } from "./nav-link";

export function MainNav({ docsNav }: { docsNav: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    searchOpen && searchRef.current?.focus();
  }, [searchOpen]);

  const pathname = usePathname();

  return (
    <>
      {/* DESKTOP */}
      <nav
        className={clsx(
          "hidden md:block",
          "sticky top-0 max-sm:bottom-0 w-full z-50 bg-canvas",
          menuOpen ? "h-[100dvh]" : "h-auto",
        )}
      >
        <div className="container max-w-docs flex items-center justify-between h-nav">
          <div className="flex items-center gap-1">
            <NavLinkLogo prominent href="/" className="pr-w4">
              <JazzLogo className="h-[36px]" />
            </NavLinkLogo>
            {primaryItems.map((item, i) => (
              <NavLink key={i} href={item.href}>
                {item.title}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {secondaryItems.map((item, i) => (
              <NavLink key={i} href={item.href} newTab={item.newTab}>
                {item.title}
              </NavLink>
            ))}
            <div className="flex items-center gap-w6 pl-w8">
              {socialLinks.map((item, i) => (
                <NavLinkLogo key={i} href={item.href} newTab={item.newTab}>
                  {item.icon}
                </NavLinkLogo>
              ))}
            </div>
          </div>
        </div>
        <hr className="-mt-px" />
      </nav>

      {/* MOBILE */}
      <div className="flex items-center self-stretch px-4 md:hidden dark:text-white">
        <NavLinkLogo prominent href="/" className="mr-auto">
          <JazzLogo className="w-24" />
        </NavLinkLogo>
        <button
          className="flex items-center p-3 rounded-xl"
          onMouseDown={() => {
            setMenuOpen((o) => !o);
            setSearchOpen(false);
          }}
        >
          <MenuIcon className="mr-2" />
          <BreadCrumb items={primaryItems} />
        </button>
      </div>
      <div
        onClick={() => {
          setMenuOpen(false);
          setSearchOpen(false);
        }}
        className={cn(
          menuOpen || searchOpen ? "block" : "hidden",
          "fixed top-0 bottom-0 left-0 right-0 bg-stone-200/80 dark:bg-black/80 w-full h-full z-20",
        )}
      ></div>
      <nav
        className={cn(
          "md:hidden fixed flex flex-col bottom-4 right-4 z-50",
          "bg-stone-50 dark:bg-stone-925 dark:text-white border border-stone-100 dark:border-stone-900 dark:outline dark:outline-1 dark:outline-black/60 rounded-lg shadow-lg",
          menuOpen || searchOpen ? "left-4" : "",
        )}
      >
        <div className={cn(menuOpen ? "block" : "hidden", " px-2 pb-2")}>
          <div className="flex items-center w-full border-b border-stone-100 dark:border-stone-900">
            <NavLinkLogo
              prominent
              href="/"
              className="mr-auto"
              onClick={() => setMenuOpen(false)}
            >
              <JazzLogo className="w-24" />
            </NavLinkLogo>
            {primaryItems.map((item, i) => (
              <NavLinkLogo key={i} href={item.href}>
                {/* {item.icon} */} HEY
              </NavLinkLogo>
            ))}
          </div>

          {pathname === "/docs" && (
            <div className="max-h-[calc(100dvh-15rem)] p-4 border-b border-stone-100 dark:border-stone-900 overflow-x-auto prose-sm prose-ul:pl-1 prose-ul:ml-1 prose-li:my-2 prose-li:leading-tight prose-ul:list-['-']">
              {docsNav}
            </div>
          )}

          {/* <div className="flex justify-end gap-4 -mb-2">
                        {items
                            .filter((item) => !("icon" in item))
                            .slice(0, 3)
                            .map((item, i) => (
                                <>
                                    <NavLink
                                        key={i}
                                        href={item.href}
                                        onClick={() => setMenuOpen(false)}
                                        newTab={item.newTab}
                                    >
                                        {item.title}
                                    </NavLink>
                                </>
                            ))}
                    </div> */}

          {/* <div className="flex justify-end gap-4 border-b border-stone-100 dark:border-stone-900">
                        {items
                            .filter((item) => !("icon" in item))
                            .slice(3)
                            .map((item, i) => (
                                <NavLink
                                    key={i}
                                    href={item.href}
                                    onClick={() => setMenuOpen(false)}
                                    newTab={item.newTab}
                                    className={cn("")}
                                >
                                    {item.title}
                                </NavLink>
                            ))}
                    </div> */}
        </div>
        <div className="flex items-center self-stretch justify-end">
          {/* <input
                        type="text"
                        className={cn(
                            menuOpen || searchOpen ? "" : "hidden",
                            "ml-2 border border-stone-200 dark:border-stone-900 px-2 py-1 rounded w-full"
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
          <button
            className="flex items-center p-3 rounded-xl"
            onMouseDown={() => {
              setMenuOpen((o) => !o);
              setSearchOpen(false);
            }}
          >
            {menuOpen || searchOpen ? (
              <XIcon />
            ) : (
              <>
                <MenuIcon className="mr-2" />
                <BreadCrumb items={primaryItems} />
              </>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
