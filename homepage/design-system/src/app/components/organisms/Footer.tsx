"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { ThemeToggle } from "../molecules/ThemeToggle";

type FooterSection = {
  title: string;
  links: {
    href: string;
    label: string;
    newTab?: boolean;
  }[];
};

type FooterProps = {
  logo: ReactNode;
  companyName: string;
  sections: FooterSection[];
};

function Copyright({
  className,
  companyName,
}: {
  companyName: string;
  className?: string;
}) {
  return (
    <p className={clsx(className, "text-sm")}>
      © {new Date().getFullYear()} {companyName}
    </p>
  );
}

export function Footer({ logo, companyName, sections }: FooterProps) {
  return (
    <footer
      className="w-full border-t bg-stone-100 mt-12 md:mt-20 dark:bg-stone-925"
      data-pagefind-ignore="all"
    >
      <div className="container py-8 md:py-16 grid gap-y-8 grid-cols-12">
        <div className="flex flex-col justify-between col-span-full md:col-span-4">
          {logo}

          <Copyright className="hidden md:block" companyName={companyName} />
        </div>

        {sections.map((section, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 text-sm col-span-4 sm:col-span-4 md:col-span-2"
          >
            <h2 className="font-medium">{section.title}</h2>
            {section.links.map((link, linkIndex) => (
              <FooterLink key={linkIndex} href={link.href} newTab={link.newTab}>
                {link.label}
              </FooterLink>
            ))}
          </div>
        ))}

        <div className="hidden md:flex justify-end items-end md:col-span-2">
          <ThemeToggle />
        </div>

        <Copyright
          className="col-span-full md:hidden"
          companyName={companyName}
        />
      </div>
    </footer>
  );
}

function FooterLink({
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
        "py-0.5 px-0 text-sm",
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
