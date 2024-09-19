import { ReactNode } from "react";
import { ClassRef, PropRef } from "./tags";
import { requestProject } from "./requestProject";
import { PackageIcon } from "lucide-react";
import Link from "next/link";
import { packages } from "@/lib/packages";

export function DocNav() {
    return (
        <>
            <p className="mt-0 font-medium">
                <DocNavLink href="/docs">Guide</DocNavLink>
            </p>
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
                        <li>
                            <DocNavLink href="/docs#declaring-covalues">
                                Declaration
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="/docs#reading-covalues">
                                Reading
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="/docs#creating-covalues">
                                Creation
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="/docs#editing-and-subscription">
                                Editing & Subscription
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="/docs#persistence">
                                Persistence
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="/docs#remote-sync">
                                Remote Sync
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="/docs#simple-public-sharing">
                                Simple Public Sharing
                            </DocNavLink>
                        </li>
                    </ul>
                </li>
                <li>
                    <DocNavLink href="/docs#refs-and-on-demand-subscribe">
                        Refs & Auto-Subscribe
                    </DocNavLink>
                </li>
            </ul>
            Coming soon:
            <ul>
                <li>
                    <DocNavLink>Groups & Permissions</DocNavLink>
                </li>
                <li>
                    <DocNavLink>Auth, Accounts & Migrations</DocNavLink>
                </li>
                <li>
                    <DocNavLink>Edit Metadata & Time Travel</DocNavLink>
                </li>
                <li>
                    <DocNavLink>Backend Workers</DocNavLink>
                </li>
            </ul>
            {packages.map((packageName) => (
                <NavPackage key={packageName} package={packageName} />
            ))}
        </>
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
            <h2 className="text-sm mt-4 flex gap-1 items-center -mx-4 px-4 pt-4 border-t border-stone-200 dark:border-stone-800 ">
                <code className="font-bold">{packageName}</code>{" "}
                <PackageIcon size={15} strokeWidth={1.5} />
            </h2>
            {project.categories?.map((category) => {
                return (
                    <details
                        key={category.title}
                        open={category.title !== "Other"}
                        className="[&:not([open])_summary]:after:content-['...']"
                    >
                        <summary className="block text-xs mt-2 mb-1 cursor-pointer">
                            {category.title}
                        </summary>
                        <div className="flex gap-1 flex-wrap text-balance">
                            {category.children.map(
                                (child, i, children) =>
                                    (i == 0 ||
                                        child.name !==
                                            children[i - 1]!.name) && (
                                        <>
                                            <Link
                                                key={child.id}
                                                className="text-ellipsis overflow-hidden text-xs font-mono py-0.5 px-1.5 text-stone-800 dark:text-stone-200 bg-stone-200 dark:bg-stone-800 rounded opacity-70 hover:opacity-100"
                                                href={`/docs/api-reference/${packageName}#${child.name}`}
                                            >
                                                {child.name}
                                            </Link>
                                        </>
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
}: {
    href?: string;
    children: ReactNode;
}) {
    if (href) {
        return (
            <Link
                href={href}
                className="hover:text-black dark:hover:text-white py-1 hover:transition-colors"
            >
                {children}
            </Link>
        );
    }

    return <span className="py-1">{children}</span>;
}
