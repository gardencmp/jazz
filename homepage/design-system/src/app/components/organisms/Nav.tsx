"use client";

import {
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

type NavItemProps = {
  href: string;
  icon?: ReactNode;
  title: string;
  firstOnRight?: boolean;
  newTab?: boolean;
  items?: NavItemProps[];
};

type NavProps = {
  mainLogo: ReactNode;
  items: {
    href: string;
    icon?: ReactNode;
    title: string;
    firstOnRight?: boolean;
    newTab?: boolean;
  }[];
  docNav?: ReactNode;
  cta?: ReactNode;
};

function NavLink({
  item,
}: {
  item: NavItemProps;
}) {
  const { href, icon, title, items } = item;
  return (
    <Link
      className="px-2 lg:px-4 py-3 max-sm:w-full text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors hover:transition-none"
      href={href}
    >
      {title}
    </Link>
  );
}

function NavItem({
  item,
}: {
  item: NavItemProps;
}) {
  const { href, icon, title, items } = item;

  if (!items?.length) {
    return <NavLink item={item} />;
  }

  return (
    <Popover className="relative">
      <PopoverButton className="flex items-center gap-1.5 px-2 lg:px-4 py-3 max-sm:w-full text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white transition-colors hover:transition-none focus-visible:outline-none">
        <span>{title}</span>
        <ChevronDownIcon aria-hidden="true" className="size-4" />
      </PopoverButton>

      <PopoverPanel
        transition
        className="absolute left-1/2 -translate-x-1/2 z-10 mt-1 flex w-screen max-w-[16rem] transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="w-screen max-w-md flex-auto overflow-hidden rounded-lg border bg-white shadow-lg dark:bg-stone-925">
          <div className="px-1 py-2 grid">
            {items.map((item) => (
              <Link
                className="py-1.5 px-3 rounded hover:text-stone-900 dark:hover:text-white transition-colors"
                href={item.href}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  );
}

export function MobileNav({ mainLogo, items, docNav, cta }: NavProps) {
  return <div>mobile</div>;
}

export function Nav({ mainLogo, items, docNav, cta }: NavProps) {
  return (
    <div className="w-full border-b py-2 border-b sticky top-0 z-50 bg-white dark:bg-stone-950">
      <PopoverGroup className="container flex justify-between gap-4">
        <Link href="/" className="flex items-center">
          {mainLogo}
        </Link>

        <div className="flex items-center text-sm gap-4">
          {items.map((item, i) => (
            <NavItem key={i} item={item} />
          ))}
        </div>

        <div className="flex items-center">{cta}</div>
      </PopoverGroup>
    </div>
  );
}
