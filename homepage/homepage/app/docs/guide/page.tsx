import Guide from "../guide.mdx";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import {clsx} from "clsx";

export default function Page() {
    const navItems = [
        {
            name: "Project Setup",
            href: "/docs/guide#project-setup",
        },
        {
            name: "Intro to CoValues",
            href: "/docs/guide#intro-to-covalues",
            items: [
                {
                    name: "Declaration",
                    href: "/docs/guide#declaring-covalues",
                },
                {
                    name: "Reading",
                    href: "/docs/guide#reading-covalues",
                },
                {
                    name: "Creation",
                    href: "/docs/guide#creating-covalues",
                },
                {
                    name: "Editing & Subscription",
                    href: "/docs/guide#editing-and-subscription",
                },
                {
                    name: "Persistence",
                    href: "/docs/guide#persistence",
                },
                {
                    name: "Remote Sync",
                    href: "/docs/guide#remote-sync",
                },
                {
                    name: "Simple Public Sharing",
                    href: "/docs/guide#simple-public-sharing",
                },
            ],
        },
        {
            name: "Refs & Auto-Subscribe",
            href: "/docs/guide#refs-and-on-demand-subscribe",
            items: [
                {
                    name: "Precise Loading Depths",
                    href: "/docs/guide#loading-depth",
                },
            ],
        },
        {
            name: "Groups & Permissions",
            href: "/docs/guide#groups-and-permissions",
            items: [
                {
                    name: "Groups/Accounts as Scopes",
                    href: "/docs/guide#groups-accounts-as-scopes",
                },
                {
                    name: "Creating Invites",
                    href: "/docs/guide#creating-invites",
                },
                {
                    name: "Consuming Invites",
                    href: "/docs/guide#consuming-invites",
                },
            ],
        },
    ];
    return (
        <div className={clsx(
          "col-span-12 md:col-span-8 lg:col-span-10",
          "lg:grid lg:grid-cols-10"
        )}>
            <Prose className="col-span-full lg:col-span-8">
                <Guide />
            </Prose>
            <TableOfContents className="lg:col-span-2" items={navItems} />
        </div>
    );
}
