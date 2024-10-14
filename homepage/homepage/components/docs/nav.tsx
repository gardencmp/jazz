import { requestProject } from "./requestProject";
import { ChevronRight, PackageIcon } from "lucide-react";
import { packages } from "@/lib/packages";
import Link from "next/link";
import { ReactNode } from "react";
import { clsx } from "clsx";
import { docNavigationItems } from "@/lib/docNavigationItems";

export function DocNav({ className }: { className?: string }) {
    return (
        <div className={clsx(className, "text-sm space-y-5 pr-3")}>
            {docNavigationItems.map(({ name, href, items }) => (
                <div key={name}>
                    <DocNavHeader href={href}>{name}</DocNavHeader>
                    {items &&
                        items.map(({ name, href, items }) => (
                            <ul key={name}>
                                <li>
                                    <DocNavLink href={href}>{name}</DocNavLink>
                                </li>
                                {items?.length > 0 && (
                                    <ul className="pl-4">
                                        {items.map(({ name, href }) => (
                                            <li key={href}>
                                                <DocNavLink href={href}>
                                                    {name}
                                                </DocNavLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </ul>
                        ))}
                </div>
            ))}

            <div>
                <DocNavHeader href="/docs/api-reference">
                    API Reference
                </DocNavHeader>
                <ul className="space-y-8">
                    {packages.map(({ name }) => (
                        <li key={name}>
                            <NavPackage package={name} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );

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
                <DocNavHeader>Resources</DocNavHeader>
                <ul>
                    <li>
                        <DocNavLink href="/docs/resources/examples">
                            Example Apps
                        </DocNavLink>
                    </li>
                </ul>
            </div>

            <div>
                <DocNavHeader href="/docs/api-reference">
                    API Reference
                </DocNavHeader>
                <ul className="space-y-8">
                    {packages.map(({ name }) => (
                        <li key={name}>
                            <NavPackage package={name} />
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
    href?: string;
    children: ReactNode;
    className?: string;
}) {
    const classes = clsx(className, "py-1 block hover:transition-colors");

    if (href) {
        return (
            <Link
                href={href}
                className={clsx(
                    classes,
                    "hover:text-black dark:hover:text-stone-200 hover:transition-colors",
                )}
            >
                {children}
            </Link>
        );
    }

    return <p className={classes}>{children}</p>;
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
