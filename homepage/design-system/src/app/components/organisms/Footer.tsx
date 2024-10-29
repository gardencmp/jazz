"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

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

export function Footer({ logo, companyName, sections }: FooterProps) {
    return (
        <footer className="flex z-10 mt-10 min-h-[15rem] border-t bg-stone-100 dark:bg-stone-925 text-stone-600 dark:text-stone-400 w-full justify-center ">
            <div className="p-8 container w-full grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8 max-sm:mb-12">
                <div className="col-span-full md:col-span-1 sm:row-start-4 md:row-start-auto lg:col-span-2 md:row-span-2 md:flex-1 flex flex-row md:flex-col max-sm:mt-4 justify-between max-sm:items-start gap-2 text-sm min-w-[10rem]">
                    {logo}
                    <p className="max-sm:text-right">
                        © {new Date().getFullYear()}
                        <br />
                        {companyName}
                    </p>
                </div>
                {sections.map((section, index) => (
                    <div key={index} className="flex flex-col gap-2 text-sm">
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
