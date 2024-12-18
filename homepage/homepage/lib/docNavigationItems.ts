export const docNavigationItems = [
  {
    // welcome to jazz
    name: "Getting started",
    items: [
      {
        // what is jazz, supported environments, where to start (guide, examples, project setup)
        name: "Introduction",
        href: "/docs",
        done: 100,
      },
      {
        name: "Guide",
        href: "/docs/guide",
        done: {
          react: 100,
          "react-native": 0,
          vue: 0,
          svelte: 0,
        },
      },
    ],
  },
  {
    name: "Project setup",
    items: [
      {
        name: "Installation",
        href: "/docs/project-setup",
        done: {
          react: 100,
          vue: 100,
          "react-native": 100,
          svelte: 100,
        },
      },
      {
        // jazz mesh, setting api key, free plan, unlimited
        name: "Sync and storage",
        href: "/docs/sync-and-storage",
        done: 100,
      },
      {
        name: "Node.JS / server workers",
        href: "/docs/project-setup/server-side",
        done: 80,
      },
    ],
  },
  {
    name: "Defining schemas",
    items: [
      {
        name: "CoValues",
        href: "/docs/schemas/covalues",
        done: 20,
      },
      {
        name: "Accounts & migrations",
        href: "/docs/schemas/accounts-and-migrations",
        done: 0,
      },
    ],
  },
  {
    name: "Using CoValues",
    items: [
      {
        name: "Creation & ownership",
        href: "/docs/using-covalues/creation",
        done: 0,
      },
      {
        name: "Reading",
        href: "/docs/using-covalues/reading",
        done: 0,
      },
      {
        name: "Subscribing & deep loading",
        href: "/docs/using-covalues/subscription-and-loading",
        done: 0,
      },
      {
        name: "Writing & deleting",
        href: "/docs/using-covalues/writing",
        done: 0,
      },
      {
        name: "Metadata & time-travel",
        href: "/docs/using-covalues/metadata",
        done: 0,
      },
    ],
  },
  {
    name: "Groups, permissions & sharing",
    items: [
      {
        name: "Groups as permission scopes",
        href: "/docs/groups/intro",
        done: 10,
      },
      {
        name: "Public sharing & Invites",
        href: "/docs/groups/sharing",
        done: 0,
      },
      {
        name: "Group inheritance",
        href: "/docs/groups/inheritance",
        done: 0,
      },
    ],
  },
  {
    name: "Authentication methods",
    items: [
      {
        name: "Overview",
        href: "/docs/authentication/auth-methods",
        done: {
          react: 50,
          vue: 0,
          "react-native": 0,
          svelte: 0,
        },
      },
      {
        name: "Passphrase",
        href: "/docs/authentication/auth-methods#passphrase",
        done: {
          react: 50,
          vue: 0,
          "react-native": 0,
          svelte: 0,
        },
      },
      {
        name: "Passkey",
        href: "/docs/authentication/auth-methods#passkey",
        done: {
          react: 50,
          vue: 0,
          "react-native": 0,
          svelte: 0,
        },
      },
      {
        name: "Clerk",
        href: "/docs/authentication/auth-methods#clerk",
        done: {
          react: 50,
          vue: 0,
          "react-native": 0,
          svelte: 0,
        },
      },
      {
        name: "Writing your own",
        href: "/docs/authentication/writing-your-own",
        done: 0,
      },
    ],
  },
  {
    name: "Resources",
    items: [
      {
        name: "Example apps",
        href: "/examples",
        done: 30,
      },
      {
        name: "Jazz under the hood",
        href: "/docs/jazz-under-the-hood",
        done: 0,
      },
    ],
  },
];
