"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { ThemeToggle } from "../molecules/ThemeToggle";
import { NewsletterForm } from "./NewsletterForm";

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
  socials?: {
    href: string;
    icon: ReactNode;
    label: string;
  }[];
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

export function Footer({ logo, companyName, sections, socials }: FooterProps) {
  return (
    <footer className="w-full border-t py-8 mt-12 md:mt-20">
      <div className="container grid gap-8 md:gap-12">
        <div className=" grid gap-y-8 grid-cols-12">
          <div className="flex flex-col gap-6 justify-between col-span-full md:col-span-7">
            {logo}
            <NewsletterForm />
          </div>

          {sections.map((section, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 text-sm col-span-6 md:col-span-2"
            >
              <h2 className="font-medium">{section.title}</h2>
              {section.links.map((link, linkIndex) => (
                <FooterLink
                  key={linkIndex}
                  href={link.href}
                  newTab={link.newTab}
                >
                  {link.label}
                </FooterLink>
              ))}
            </div>
          ))}

          <div className="hidden md:flex justify-end items-end md:col-span-1">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-y-6 gap-3 md:flex-row">
          <Copyright companyName={companyName} />

          <div className="flex gap-6 order-first md:order-last">
            {socials?.map(({ href, icon, label }) => (
              <a
                key={label}
                href={href}
                className="hover:text-stone-900 hover:dark:text-white"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
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
