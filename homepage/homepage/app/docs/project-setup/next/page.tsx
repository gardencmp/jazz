import NextGuide from "./next.mdx";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { clsx } from "clsx";

const navItems = [
    {
        name: "Client-side only",
        href: "/docs/project-setup/react#next-csr",
    },
    {
        name: "SSR use 🧪",
        href: "/docs/project-setup/react#next-ssr",
    },
    {
        name: "SSR + client-side 🧪",
        href: "/docs/project-setup/react#next-ssr-plus-csr",
    },
];

export default function Page() {
    return (
        <div
            className={clsx(
                "col-span-12 md:col-span-8 lg:col-span-9",
                "flex justify-center lg:gap-5",
            )}
        >
            <Prose className="overflow-x-hidden lg:flex-1">
                <NextGuide />
            </Prose>
            <TableOfContents className="w-48 shrink-0" items={navItems} />
        </div>
    );
}
