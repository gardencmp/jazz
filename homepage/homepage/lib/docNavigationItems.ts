export const docNavigationItems = [
    {
        // welcome to jazz
        name: "Getting started",
        href: "/docs",
        items: [
            {
                // what is jazz, supported environments, where to start (guide, examples, project setup)
                name: "Introduction",
                href: "/docs",
            },
            {
                name: "Guide",
                href: "/docs/guide",
            },
        ],
    },
    {
        name: "Building your app",
        items: [
            {
                // installation guide for react, react native
                name: "Project setup",
                href: "/docs/project-setup",
            },
            { name: "Authentication", href: "" },
            {
                name: "Schema",
                href: "",
                items: [
                    {
                        name: "Defining",
                        href: "/docs/schema/defining",
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
            { name: "Simple Public Sharing", href: "" },
            { name: "Groups & Permissions", href: "" },
            {
                // jazz mesh, setting api key, free plan, unlimited
                name: "Sync & Storage",
                href: "/docs/sync-and-storage",
            },
        ],
    },
    // {
    //     // introduction to covalues
    //     name: "Schema",
    //     href: "/docs/schema",
    //     items: [
    //         {
    //             name: "Defining",
    //             href: "/docs/schema/defining",
    //         },
    //         {
    //             name: "Creating",
    //             href: "/docs/schema/creating",
    //         },
    //         {
    //             // loading depth
    //             name: "Reading and subscribing",
    //             href: "/docs/schema/reading",
    //         },
    //         {
    //             name: "Updating",
    //             href: "/docs/schema/updating",
    //         },
    //         {
    //             name: "Deleting",
    //             href: "/docs/schema/deleting",
    //         },
    //     ],
    // },
    // {
    //     // setting up using clerk or demo auth?
    //     name: "Authentication",
    //     href: "/docs/authentication",
    //     items: [
    //         {
    //             // profile, root, creating initial data
    //             name: "Account",
    //             href: "/docs/authentication/account",
    //         },
    //     ],
    // },
    {
        name: "Resources",
        items: [
            {
                name: "Example apps",
                href: "/docs/examples",
            },
        ],
    },
];

export const docNavigationItemsOld = [
    {
        // welcome to jazz
        name: "Getting started",
        href: "/docs/guide",
        items: [
            {
                name: "Guide",
                href: "/docs/guide",
            },
        ],
    },
    {
        name: "Resources",
        items: [
            {
                name: "Example apps",
                href: "/docs/examples",
            },
        ],
    },
];
