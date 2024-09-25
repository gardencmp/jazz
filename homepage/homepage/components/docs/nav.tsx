import { requestProject } from "./requestProject";
import { ChevronRight, PackageIcon } from "lucide-react";
import { packages } from "@/lib/packages";
import Link from "next/link";
import { ReactNode } from "react";
import { clsx } from "clsx";

export function DocNav({ className }: { className?: string }) {
    const comingSoon = [
        "Auth, Accounts & Migrations",
        "Edit Metadata & Time Travel",
        "Backend Workers",
    ];

    const covaluesItems = [
        {
            name: "Declaration",
            href: "/docs#declaring-covalues",
        },
        {
            name: "Reading",
            href: "/docs#reading-covalues",
        },
        {
            name: "Creation",
            href: "/docs#creating-covalues",
        },
        {
            name: "Editing & Subscription",
            href: "/docs#editing-and-subscription",
        },
        {
            name: "Persistence",
            href: "/docs#persistence",
        },
        {
            name: "Remote Sync",
            href: "/docs#remote-sync",
        },
        {
            name: "Simple Public Sharing",
            href: "/docs#simple-public-sharing",
        },
    ];

    const refsItems = [
        {
            name: "Precise Loading Depths",
            href: "/docs#loading-depth",
        },
    ];

    const groupsItems = [
        {
            name: "Groups/Accounts as Scopes",
            href: "/docs#groups-accounts-as-scopes",
        },
        {
            name: "Creating Invites",
            href: "/docs#creating-invites",
        },
        {
            name: "Consuming Invites",
            href: "/docs#consuming-invites",
        },
    ];

    return (
        <div className={clsx(className, "text-sm space-y-5 pr-3")}>
            <div>
                <DocNavHeader href="/docs">Guide</DocNavHeader>
                <ul>
                    <li>
                        <DocNavLink href="/docs#guide-setup">
                            Project Setup
                        </DocNavLink>
                    </li>
                    <li>
                        <DocNavLink href="/docs#intro-to-covalues">
                            Intro to CoValues
                        </DocNavLink>
                        <ul>
                            {covaluesItems.map((item) => (
                                <li key={item.name}>
                                    <DocNavLink
                                        className="pl-4"
                                        href={item.href}
                                    >
                                        {item.name}
                                    </DocNavLink>
                                </li>
                            ))}
                        </ul>
                    </li>
                    <li>
                        <DocNavLink href="/docs#refs-and-on-demand-subscribe">
                            Refs & Auto-Subscribe
                        </DocNavLink>
                        <ul>
                            {refsItems.map((item) => (
                                <li key={item.name}>
                                    <DocNavLink
                                        className="pl-4"
                                        href={item.href}
                                    >
                                        {item.name}
                                    </DocNavLink>
                                </li>
                            ))}
                        </ul>
                    </li>
                    <li>
                        <DocNavLink href="/docs#groups-and-permissions">
                            Groups & Permissions
                        </DocNavLink>
                        <ul>
                            {groupsItems.map((item) => (
                                <li key={item.name}>
                                    <DocNavLink
                                        className="pl-4"
                                        href={item.href}
                                    >
                                        {item.name}
                                    </DocNavLink>
                                </li>
                            ))}
                        </ul>
                    </li>
                </ul>
            </div>

            <div>
                <DocNavHeader>Coming soon</DocNavHeader>
                <ul>
                    {comingSoon.map((item) => (
                        <li className="py-1" key={item}>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <DocNavHeader>API Reference</DocNavHeader>
                <ul className="space-y-8">
                    {packages.map((packageName) => (
                        <li key={packageName}>
                            <NavPackage package={packageName} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export async function NavPackage({
    package: packageName,
}: {
    package: string;
}) {
    let project = await requestProject(packageName as any);

    return (
        <>
            <DocNavLink
                className="mb-1 flex gap-2 items-center"
                href={`/docs/api-reference/${packageName}`}
            >
                <PackageIcon size={15} strokeWidth={1.5} />
                {packageName}
            </DocNavLink>
            {project.categories?.map((category) => {
                return (
                    <details
                        key={category.title}
                        open={category.title !== "Other"}
                        className="group ml-1.5 border-l dark:border-stone-900"
                    >
                        <summary className="pl-[13px] py-1 cursor-pointer flex gap-2 items-center justify-between hover:text-stone-800 dark:hover:text-stone-200 [&::-webkit-details-marker]:hidden">
                            {category.title}

                            <ChevronRight className="w-4 h-4 text-stone-300 group-open:rotate-90 transition-transform dark:text-stone-800" />
                        </summary>
                        <div className="pl-6">
                            {category.children.map(
                                (child, i, children) =>
                                    (i == 0 ||
                                        child.name !==
                                            children[i - 1]!.name) && (
                                        <Link
                                            key={child.id}
                                            className="block py-0.5 text-ellipsis overflow-hidden font-mono hover:text-stone-800 dark:hover:text-stone-200"
                                            href={`/docs/api-reference/${packageName}#${child.name}`}
                                        >
                                            {child.name}
                                        </Link>
                                    ),
                            )}
                        </div>
                    </details>
                );
            })}
        </>
    );
}

export function DocNavLink({
    href,
    children,
    className = "",
}: {
    href: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <Link
            href={href}
            className={clsx(
                className,
                "py-1 hover:text-black dark:hover:text-stone-200 block hover:transition-colors",
            )}
        >
            {children}
        </Link>
    );
}

function DocNavHeader({
    href,
    children,
}: {
    href?: string;
    children: ReactNode;
}) {
    const className = "block font-medium text-stone-900 py-1 dark:text-white";

    if (href) {
        return (
            <Link className={className} href={href}>
                {children}
            </Link>
        );
    }

    return <p className={className}>{children}</p>;
}
