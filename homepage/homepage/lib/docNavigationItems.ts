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
                // jazz mesh, setting api key, free plan, unlimited
                name: "Sync and storage",
                href: "/docs/sync-and-storage",
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
        href: "/docs/guide",
        items: [
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
    {
        name: "Resources",
        items: [
            {
                name: "Example apps",
                href: "/docs/resources/examples",
            },
        ],
    },
];
