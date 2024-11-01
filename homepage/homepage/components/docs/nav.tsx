import { requestProject } from "./requestProject";
import { ChevronRight, PackageIcon } from "lucide-react";
import { packages } from "@/lib/packages";
import Link from "next/link";
import { docNavigationItems } from "@/lib/docNavigationItems";
import { SideNavItem } from "@/components/SideNavItem";
import { SideNavHeader } from "@/components/SideNavHeader";
import { SideNav } from "@/components/SideNav";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function DocNav({ className }: { className?: string }) {
    return (
        <SideNav
            items={docNavigationItems}
            className={clsx(
                twMerge(
                    "pr-3 md:col-span-4 lg:col-span-3",
                    "sticky align-start top-[4.75rem] h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden",
                    "hidden md:block",
                    className,
                ),
            )}
        >
            <div>
                <SideNavHeader href="/docs/api-reference">
                    API Reference
                </SideNavHeader>
                <ul className="space-y-8">
                    {packages.map(({ name }) => (
                        <li key={name}>
                            <PackageNavItem package={name} />
                        </li>
                    ))}
                </ul>
            </div>
        </SideNav>
    );
}

export async function PackageNavItem({
    package: packageName,
}: {
    package: string;
}) {
    let project = await requestProject(packageName as any);

    return (
        <>
            <SideNavItem
                className="mb-1 flex gap-2 items-center"
                href={`/docs/api-reference/${packageName}`}
            >
                <PackageIcon size={15} strokeWidth={1.5} />
                {packageName}
            </SideNavItem>
            {project.categories?.map((category) => {
                return (
                    <details
                        key={category.title}
                        open={category.title !== "Other"}
                        className="group ml-1.5 border-l"
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
