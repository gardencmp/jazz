import { requestProject } from "./requestProject";
import { PackageIcon } from "lucide-react";
import { DocNavLink } from "gcmp-design-system/src/app/components/atoms/DocNavLink";
import { JazzLogo } from "../logos";
import { Nav } from "gcmp-design-system/src/app/components/organisms/Nav";
import { SiDiscord, SiGithub, SiTwitter } from "@icons-pack/react-simple-icons";

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
    return (
        <>
            <p className="mt-0 font-medium">
                <DocNavLink href="#guide">Guide</DocNavLink>
            </p>

            <ul>
                <li>
                    <DocNavLink href="#guide-setup">Project Setup</DocNavLink>
                </li>
                <li>
                    <DocNavLink href="#intro-to-covalues">
                        Intro to CoValues
                    </DocNavLink>
                    <ul>
                        <li>
                            <DocNavLink href="#declaring-covalues">
                                Declaration
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#reading-covalues">
                                Reading
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#creating-covalues">
                                Creation
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#editing-and-subscription">
                                Editing & Subscription
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#persistence">
                                Persistence
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#remote-sync">
                                Remote Sync
                            </DocNavLink>
                        </li>
                        <li>
                            <DocNavLink href="#simple-public-sharing">
                                Simple Public Sharing
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
                    <DocNavLink href="#auth-accounts-and-migrations">
                        Auth, Accounts & Migrations
                    </DocNavLink>
                </li>
                <li>
                    <DocNavLink href="#edits-and-time-travel">
                        Edit Metadata & Time Travel
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
            <NavPackage package="jazz-react" />
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
                                            <a
                                                key={child.id}
                                                className="text-sm inline-block px-2 m-0.5 text-stone-800 dark:text-stone-200 bg-stone-200 dark:bg-stone-800 rounded opacity-70 hover:opacity-100 cursor-pointer"
                                                href={`#${packageName}/${child.name}`}
                                            >
                                                <code>{child.name}</code>
                                            </a>
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
