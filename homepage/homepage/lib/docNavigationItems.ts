export const docNavigationItems = [
    {
        // welcome to jazz
        name: "Getting started",
        href: "/docs",
        items: [
            {
                // what is jazz, supported environments, where to start (guide, examples, project setup)
                name: "Introduction",
                href: "/docs/introduction",
            },
            {
                name: "Deployment",
                href: "/mesh",
            },
            {
                // installation guide for react, react native
                name: "Project setup",
                href: "/docs/project-setup",
            },
        ],
    },
    {
        name: "Guide",
        href: "/guide",
        items: [
            {
                name: "Project Setup",
                href: "#setup",
            },
            {
                name: "Intro to CoValues",
                href: "/docs#intro-to-covalues",
                items: [
                    {
                        name: "Declaration",
                        href: "/guide#declaring-covalues",
                    },
                    {
                        name: "Reading",
                        href: "/guide#reading-covalues",
                    },
                    {
                        name: "Creation",
                        href: "/guide#creating-covalues",
                    },
                    {
                        name: "Editing & Subscription",
                        href: "/guide#editing-and-subscription",
                    },
                    {
                        name: "Persistence",
                        href: "/guide#persistence",
                    },
                    {
                        name: "Remote Sync",
                        href: "/guide#remote-sync",
                    },
                    {
                        name: "Simple Public Sharing",
                        href: "/guide#simple-public-sharing",
                    },
                ],
            },
            {
                name: "Refs & Auto-Subscribe",
                href: "/guide#refs-and-on-demand-subscribe",
                items: [
                    {
                        name: "Precise Loading Depths",
                        href: "/guide#loading-depth",
                    },
                ],
            },
            {
                name: "Groups & Permissions",
                href: "/guide#groups-and-permissions",
                items: [
                    {
                        name: "Groups/Accounts as Scopes",
                        href: "/guide#groups-accounts-as-scopes",
                    },
                    {
                        name: "Creating Invites",
                        href: "/guide#creating-invites",
                    },
                    {
                        name: "Consuming Invites",
                        href: "/guide#consuming-invites",
                    },
                ],
            },
            // {
            //     name: "Coming soon",
            //     items: [
            //         "Auth, Accounts & Migrations",
            //         "Edit Metadata & Time Travel",
            //         "Backend Workers",
            //     ],
            // },
        ],
    },
    {
        // introduction to covalues
        name: "Schema",
        href: "/docs/schema",
        items: [
            {
                name: "Defining",
                href: "/docs/schema/defining",
                items: [
                    {
                        // different types you can use (string, date, optiona/required fields, refs)
                        name: "CoMap",
                        href: "/comap",
                    },
                    {
                        name: "CoList",
                        href: "/colist",
                    },
                ],
            },
            {
                name: "Creating",
                href: "/docs/schema/creating",
            },
            {
                // loading depth
                name: "Reading and subscribing",
                href: "/docs/schema/reading",
            },
            {
                name: "Updating",
                href: "/docs/schema/updating",
            },
            {
                name: "Deleting",
                href: "/docs/schema/deleting",
            },
        ],
    },
    {
        // setting up using clerk or demo auth?
        name: "Authentication",
        href: "/docs/authentication",
        items: [
            {
                // profile, root, creating initial data
                name: "Account",
                href: "/docs/authentication/account",
            },
        ],
    },
];
