"use client";

import { cn } from "@/lib/utils";
import { MenuIcon, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useLayoutEffect, useRef, useState } from "react";

export function Nav({
    mainLogo,
    items,
}: {
    mainLogo: ReactNode;
    items: {
        href: string;
        icon?: ReactNode;
        title: string;
        firstOnRight?: boolean;
    }[];
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        searchOpen && searchRef.current?.focus();
    }, [searchOpen]);

    return (
        <>
            <nav
                className={[
                    "hidden md:flex sticky left-0 right-0 top-0 max-sm:bottom-0 w-full justify-center",
                    "bg-stone-50/70 dark:bg-stone-950/70 border-b max-sm:border-t border-stone-50 dark:border-b-stone-950 backdrop-blur-md",
                    "max-h-none overflow-hidden transition[max-height] duration-300 ease-in-out",
                    menuOpen ? "h-[100dvh]" : "h-16",
                ].join(" ")}
            >
                <div className="flex flex-wrap px-8 items-center max-sm:justify-between lg:gap-2 max-w-[80rem] w-full">
                    <div className="flex items-center flex-shrink">
                        <NavLinkLogo prominent href="/" className="-ml-2">
                            {mainLogo}
                        </NavLinkLogo>
                    </div>
                    {items.map((item, i) =>
                        "icon" in item ? (
                            <NavLinkLogo key={i} href={item.href}>
                                {item.icon}
                            </NavLinkLogo>
                        ) : (
                            <NavLink
                                key={i}
                                href={item.href}
                                className={cn(
                                    "max-sm:w-full",
                                    item.firstOnRight ? "md:ml-auto" : ""
                                )}
                            >
                                {item.title}
                            </NavLink>
                        )
                    )}
                </div>
            </nav>
            <div className="md:hidden px-4 flex items-center self-stretch dark:text-white">
                <NavLinkLogo
                    prominent
                    href="/"
                    className="mr-auto"
                >
                    {mainLogo}
                </NavLinkLogo>
                <button
                    className="flex p-3 rounded-xl"
                    onMouseDown={() => {
                        setMenuOpen((o) => !o);
                        setSearchOpen(false);
                    }}
                >
                    <MenuIcon className="" />
                </button>
            </div>
            <div
                onClick={() => {
                    setMenuOpen(false);
                    setSearchOpen(false);
                }}
                className={cn(
                    menuOpen || searchOpen ? "block" : "hidden",
                    "fixed top-0 bottom-0 left-0 right-0 bg-stone-200/80 dark:bg-black/80 w-full h-full"
                )}
            ></div>
            <nav
                className={cn(
                    "md:hidden fixed flex flex-col items-end bottom-4 right-4",
                    "bg-stone-50 dark:bg-stone-925 dark:text-white border border-stone-100 dark:border-stone-900 dark:outline dark:outline-1 dark:outline-black/60 rounded-lg shadow-lg",
                    menuOpen || searchOpen ? "left-4" : ""
                )}
            >
                <div
                    className={cn(
                        menuOpen ? "flex" : "hidden",
                        "flex-wrap px-2 pb-2"
                    )}
                >
                    <div className="flex items-center w-full border-b border-stone-100 dark:border-stone-900">
                        <NavLinkLogo
                            prominent
                            href="/"
                            className="-ml-4 mr-auto"
                            onClick={() => setMenuOpen(false)}
                        >
                            {mainLogo}
                        </NavLinkLogo>
                        {items
                            .filter((item) => "icon" in item)
                            .map((item, i) => (
                                <NavLinkLogo key={i} href={item.href}>
                                    {item.icon}
                                </NavLinkLogo>
                            ))}
                    </div>
                    {items
                        .filter((item) => !("icon" in item))
                        .map((item, i) => (
                            <NavLink
                                key={i}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className={cn(
                                    "max-sm:w-full border-b border-stone-100 dark:border-stone-900",
                                    item.firstOnRight ? "md:ml-auto" : ""
                                )}
                            >
                                {item.title}
                            </NavLink>
                        ))}
                </div>
                <div className="flex items-center self-stretch justify-end">
                    <input
                        type="text"
                        className={cn(
                            menuOpen || searchOpen ? "" : "hidden",
                            "ml-2 border border-stone-200 dark:border-stone-900 px-2 py-1 rounded w-full"
                        )}
                        placeholder="Search docs..."
                        ref={searchRef}
                    />
                    <button
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
                    </button>
                    <button
                        className="flex p-3 rounded-xl"
                        onMouseDown={() => {
                            setMenuOpen((o) => !o);
                            setSearchOpen(false);
                        }}
                    >
                        {(menuOpen || searchOpen) ? <XIcon/>: <MenuIcon className="" />}
                    </button>
                </div>
            </nav>
        </>
    );
}

export function NavLink({
    href,
    className,
    children,
    onClick,
}: {
    href: string;
    className?: string;
    children: ReactNode;
    onClick?: () => void;
}) {
    const path = usePathname();

    return (
        <Link
            href={href}
            className={[
                "px-2 lg:px-4 py-3 text-sm",
                className,
                path === href
                    ? "font-medium text-black dark:text-white cursor-default"
                    : "text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors hover:transition-none",
            ].join(" ")}
            onClick={onClick}
        >
            {children}
        </Link>
    );
}

export function NavLinkLogo({
    href,
    className,
    children,
    prominent,
    onClick,
}: {
    href: string;
    className?: string;
    children: ReactNode;
    prominent?: boolean;
    onClick?: () => void;
}) {
    const path = usePathname();

    return (
        <Link
            href={href}
            className={[
                "max-sm:px-4 px-2 lg:px-3 py-3 transition-opacity hover:transition-none",
                path === href
                    ? "cursor-default"
                    : prominent
                    ? "hover:opacity-50"
                    : "opacity-60 hover:opacity-100",
                "text-black dark:text-white",
                className,
            ].join(" ")}
            onClick={onClick}
        >
            {children}
        </Link>
    );
}
