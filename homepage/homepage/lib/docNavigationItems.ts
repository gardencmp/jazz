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
        done: 50,
      },
    ],
  },
  {
    name: "Project setup",
    items: [
      {
        name: "Installation",
        href: "/docs/project-setup",
        done: 100,
      },
      {
        // jazz mesh, setting api key, free plan, unlimited
        name: "Sync and storage",
        href: "/docs/sync-and-storage",
        done: 100,
      },
      // {
      //   name: "React",
      //   href: "/docs/project-setup/react",
      //   done: 80,
      // },
      // {
      //   name: "React Native",
      //   href: "/docs/project-setup/react-native",
      // },
      // {
      //   name: "Next.js",
      //   href: "/docs/project-setup/next",
      // },
      // {
      //   name: "VueJS",
      //   href: "/docs/project-setup/vue",
      //   done: 80,
      // },
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
        href: "/docs/schemas/accounts",
        done: 0,
      },
    ],
  },
  {
    name: "Using CoValues",
    items: [
      {
        name: "Creation & ownership",
        href: "/docs/covalues/creation",
        done: 0,
      },
      {
        name: "Subscribing & deep loading",
        href: "/docs/covalues/reading",
        done: 0,
      },
      {
        name: "Updating & deleting",
        href: "/docs/covalues/updating",
        done: 0,
      },
      {
        name: "Metadata & time-travel",
        href: "/docs/covalues/metadata",
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
        done: 0,
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
        done: 80,
      },
      {
        name: "Passphrase",
        href: "/docs/authentication/auth-methods#passphrase",
        done: 20,
      },
      {
        name: "Passkey",
        href: "/docs/authentication/auth-methods#passkey",
        done: 20,
      },
      {
        name: "Clerk",
        href: "/docs/authentication/auth-methods#clerk",
        done: 20,
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
