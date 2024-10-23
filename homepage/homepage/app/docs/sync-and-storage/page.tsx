import SyncAndStorage from "./sync-and-storage.mdx"
import { TableOfContents } from "@/components/docs/TableOfContents";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { clsx } from "clsx";

const navItems = [
    {
        name: "Using Jazz Cloud",
        href: "/docs/sync-and-storage#using-jazz-cloud",
        items: [
            {
                name: "Free Public Alpha",
                href: "/docs/sync-and-storage#free-public-alpha",
            },
        ]
    },
    {
        name: "Running your own sync server",
        href: "/docs/sync-and-storage#running-your-own",
        items: [
            {
                name: "Command line options",
                href: "/docs/sync-and-storage#command-line-options",
            },
            {
                name: "Source code",
                href: "/docs/sync-and-storage#source-code",
            },
        ]
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
                <SyncAndStorage />
            </Prose>
            <TableOfContents className="w-48 shrink-0" items={navItems} />
        </div>
    );
}
