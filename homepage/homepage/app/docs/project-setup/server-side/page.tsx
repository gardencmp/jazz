import ServerGuide from "./server-side.mdx"
import { TableOfContents } from "@/components/docs/TableOfContents";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { clsx } from "clsx";

const navItems = [
    {
        name: "Generating Credentials",
        href: "/docs/project-setup/server-side#generating-credentials",
    },
    {
        name: "Storing and Providing Credentials",
        href: "/docs/project-setup/server-side#storing-credentials",
    },
    {
        name: "Starting a Server Worker",
        href: "/docs/project-setup/server-side#starting",
    },
    {
        name: "Using CoValues instead of Requests",
        href: "/docs/project-setup/server-side#covalues-instead-of-requests",
    }
]


export default function Page() {
    return (
        <div
            className={clsx(
                "col-span-12 md:col-span-8 lg:col-span-9",
                "lg:flex lg:gap-5",
            )}
        >
            <Prose className="overflow-x-hidden lg:flex-1">
                <ServerGuide />
            </Prose>
            <TableOfContents className="w-48 shrink-0" items={navItems} />
        </div>
    );
}
