import { ReactNode } from "react";
import { ClassRef, PropRef } from "./tags";
import { requestProject } from "./requestProject";
import { PackageIcon } from "lucide-react";

export function DocNav() {
    return (
        <>
            <p className="mt-0 not-prose font-medium">
                <DocNavLink href="#guide">Guide</DocNavLink>
            </p>

            <ul>
                <li>
                    <DocNavLink href="#guide-setup">
                        Project Setup
                    </DocNavLink>
                </li>
                <li>
                    <DocNavLink href="#intro-to-covalues">
                        Intro to CoValues
                    </DocNavLink>
                    <ul>
                        <li>
                            <DocNavLink href="#intro-to-covalues">
                                Declaration
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#intro-to-covalues">
                                Reading
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#intro-to-covalues">
                                Creation
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#intro-to-covalues">
                                Editing & Subscription
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#intro-to-covalues">
                                Persistence
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#intro-to-covalues">
                                Remote Sync
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#intro-to-covalues">
                                Public Sharing
                            </DocNavLink>
                        </li>
                    </ul>
                </li>
                <li>
                    <DocNavLink href="#refs-and-on-demand-subscribe">
                        Refs & Auto-Subscribe
                    </DocNavLink>
                </li>
                <li>
                    <DocNavLink href="#groups-and-permissions">
                        Groups & Permissions
                    </DocNavLink>
                </li>
                <li>
                    <DocNavLink href="#accounts-and-migrations">
                        Accounts & Migrations
                    </DocNavLink>
                </li>
                <li>
                    <DocNavLink href="#backend-workers">
                        Backend Workers
                    </DocNavLink>
                </li>
            </ul>

            <p className="font-medium border-t -mx-4 px-4 pt-4 border-stone-200 dark:border-stone-800">
                <DocNavLink href="#faq">FAQ</DocNavLink>
            </p>

            <NavPackage package="jazz-tools" />
            <NavPackage package="jazz-react" entryPoint="index.tsx" />
            <NavPackage package="jazz-browser" />
            <NavPackage package="jazz-browser-media-images" />
            <NavPackage package="jazz-nodejs" />
        </>
    );
}

export async function NavPackage({
    package: packageName,
}: {
    package: string;
}) {
    let project = await requestProject(packageName);

    return (
        <>
            <h2 className="text-sm not-prose mt-4 flex gap-1 items-center -mx-4 px-4 pt-4 border-t border-stone-200 dark:border-stone-800 ">
                <code className="font-bold">{packageName}</code> <PackageIcon size={15} strokeWidth={1.5}/>
            </h2>
            {project.categories?.map((category) => {
                return (
                    <details key={category.title} open={category.title !== "Other"} className="[&:not([open])_summary]:after:content-['...']">
                        <summary className="block text-xs mt-2 cursor-pointer">{category.title}</summary>
                        <div className="text-sm -ml-0.5 max-w-full text-balance">
                            {category.children.map(
                                (child, i, children) =>
                                    (i == 0 ||
                                        child.name !==
                                            children[i - 1]!.name) && (<>
                                        <a
                                            key={child.id}
                                            className="inline-block not-prose px-1 m-0.5 bg-stone-200 dark:bg-stone-800 rounded opacity-70 hover:opacity-100 cursor-pointer"
                                            href={`#${packageName}/${child.name}`}
                                        >
                                            <code>{child.name}</code>
                                        </a>{"\u200B"}</>
                                    )
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
    href: string;
    children: ReactNode;
}) {
    return (
        <a
            href={href}
            className="not-prose hover:text-black dark:hover:text-white"
        >
            {children}
        </a>
    );
}
