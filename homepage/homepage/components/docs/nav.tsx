import { requestProject } from "./requestProject";
import { PackageIcon } from "lucide-react";
import { DocNavLink } from "gcmp-design-system/src/app/components/atoms/DocNavLink";
import { JazzLogo } from "../logos";
import { Nav } from "gcmp-design-system/src/app/components/organisms/Nav";
import { SiDiscord, SiGithub, SiTwitter } from "@icons-pack/react-simple-icons";
import { packages } from "@/lib/packages";
import Link from "next/link";

export function JazzNav() {
    return (
        <Nav
            mainLogo={<JazzLogo className="w-24 -ml-2" />}
            items={[
                { title: "Home", href: "/" },
                { title: "Sync & Storage Mesh", href: "/mesh" },
                {
                    title: "Docs",
                    href: "/docs",
                },
                {
                    title: "Blog",
                    href: "https://gcmp.io/news",
                    firstOnRight: true,
                    newTab: true,
                },
                {
                    title: "Releases",
                    href: "https://github.com/gardencmp/jazz/releases",
                    newTab: true,
                },
                {
                    title: "Roadmap",
                    href: "https://github.com/orgs/gardencmp/projects/4/views/3",
                    newTab: true,
                },
                {
                    title: "GitHub",
                    href: "https://github.com/gardencmp/jazz",
                    newTab: true,
                    icon: <SiGithub className="w-5" />,
                },
                {
                    title: "Discord",
                    href: "https://discord.gg/utDMjHYg42",
                    newTab: true,
                    icon: <SiDiscord className="w-5" />,
                },
                {
                    title: "X",
                    href: "https://x.com/jazz_tools",
                    newTab: true,
                    icon: <SiTwitter className="w-5" />,
                },
            ]}
            docNav={<DocNav />}
        />
    );
}

export function DocNav() {
    const comingSoon = [
        "Groups & Permissions",
        "Auth, Accounts & Migrations",
        "Edit Metadata & Time Travel",
        "Backend Workers",
    ];

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
                {comingSoon.map((item) => (
                    <li key={item}>{item}</li>
                ))}
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
                        <summary className="block text-xs mt-2 cursor-pointer">
                            {category.title}
                        </summary>
                        <div className="text-sm -ml-0.5 max-w-full text-balance">
                            {category.children.map(
                                (child, i, children) =>
                                    (i == 0 ||
                                        child.name !==
                                            children[i - 1]!.name) && (
                                        <>
                                            <Link
                                                key={child.id}
                                                className="text-sm inline-block px-2 m-0.5 text-stone-800 dark:text-stone-200 bg-stone-200 dark:bg-stone-800 rounded opacity-70 hover:opacity-100 cursor-pointer"
                                                href={`/docs/api-reference/${packageName}#${child.name}`}
                                            >
                                                <code>{child.name}</code>
                                            </Link>
                                            {"\u200B"}
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
