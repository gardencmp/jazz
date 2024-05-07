# Jazz - instant sync

<sub>Homepage: [jazz.tools](https://jazz.tools) &mdash; Docs: [DOCS.md](./DOCS.md) &mdash; Community & support: [Discord](https://discord.gg/utDMjHYg42) &mdash; Updates: [Twitter](https://twitter.com/jazz_tools) & [Email](https://gcmp.io/news)</sub>

 **Jazz is an open-source toolkit for building apps with *secure sync.***

Quickly build and ship apps with:

- **Cross-device sync**
- **Collaborative features** (incl. real-time multiplayer)
- **Instantly reacting UIs**
- Local-first storage & offline support
- File upload and real-time media streaming

# What is *secure sync*?

**Sync** means that, *instead of making API requests*, you:

- **Read and write data as if it was local** &mdash; from anywhere in your app.
- **Always have data synced to wherever it's needed, instantly:** to other devices of the same user, to other users, to your backend, to your local machine for debugging, etc.

**Secure** means that, *instead of relying on your API or DB for access control*, you:

- **Set fine-grained, role-based permissions in `Group`s** that are **synced along with your data**.
- **Permissions *verifiably enforced* everywhere,** using encryption & signatures under the hood.
- **Change roles dynamically** for evolving teams, expiring Invite Links and more.

# What's special about Jazz?

Compared to other libraries and frameworks for local-first, sync-based or real-time apps, these are some of the things that make Jazz unique:

- **Jazz is a *batteries-included,* vertically integrated toolkit,** offering everything you need to build an app, including auth, permissions, data model, sync, conflict resolution, blob storage, file uploads, real-time media streaming and more.
- **Jazz has a *small API surface* of only a few abstractions to learn,** which combine in powerful ways to implement a broad set of features.
- **Jazz *granularly* loads and caches *only the data that is needed*,** combining *local-first* instant UI reactivity and offline support with the on-demand data efficiency of conventional APIs
- **Jazz supports end-to-end encryption, but doesn't require it,** allowing you to either manage your user's secret keys for them (based on existing auth flows) or letting your users
- **Jazz is based on CoJSON, a soon-to-be *open standard,*** which means that there will be a whole ecosystem of compatible libraries and frameworks in a variety of environments &mdash; and it will be easy to achieve (secure) interop between Jazz/CoJSON-based apps and services.

# Jazz Global Mesh

Jazz is open source and you can run your own sync & storage server, but to really provide you with everything you need, we're also running
**[Jazz Global Mesh](https://jazz.tools/mesh)**, a globally distributed mesh of servers optimized for:

 - **Ultra-low-latency sync** (with geo-aware edge caching and optimal routing)
 - **Low-cost, reliable storage**


**Jazz Global Mesh is free for small volumes of data** and it's the **default syncing peer,** so you can  **start building multi-user Jazz apps with persistent data in minutes,** using only frontend code!

# Getting started

## Example App Walkthrough

**For now the best tutorial is the walkthrough of the [Todo List Example App](#todo-list).**

## General Scenarios

### Building a new, entirely sync-based React app

1. Define your data model with [cojson Collaborative Values (CoValues)](./DOCS.md#covalue).
2. Implement permission logic using [cojson Groups](./DOCS.md#group).
3. Build a user interface with [jazz-react](./DOCS.md#jazz-react) and [auto-sub](./DOCS.md#useautosubid).

### Gradually adding sync to an existing React app

Gradually migrate app features to use sync:

1. Define data model for small aspect of your app with [cojson Collaborative Values (CoValues)](./DOCS.md#covalue).
    - Schema adapters/importers for Prisma/Drizzle/PostgreSQL introspection coming soon.
2. Map existing permission logic with [cojson Groups](./DOCS.md#group) & integrate existing auth.
    - Auth integrations coming soon.
3. Replace some of the React state and API requests in your UI with [jazz-react](./DOCS.md#jazz-react) and [auto-sub](./DOCS.md#useautosubid).

# Example Apps

## Todo List

**A simple collaborative todo list app.**

Live version: https://example-todo.jazz.tools

Source code & walkthrough: [`./examples/todo`](./examples/todo)

Demonstrates:
  - Defining a data model with `CoMap`s and `CoList`s
  - Creating data and setting permissions with `Group`s
  - Fetching, rendering & editing data from nested `CoValue`s with reactive synced queries


## Rate-My-Pet

**A simple social polling app.**

Live version: https://example-pets.jazz.tools

Source code (walkthrough coming soon): [`./examples/pets`](./examples/pets)

Demonstrates:
  - Implementing per-account data streams (reactions) with `CoStream`s
  - Implementing image upload and progressive image streaming using helpers from `jazz-react-media-images` (on top of CoJSON's `BinaryCoStreams` & `ImageDefinition` convention)


# Documentation & API Reference

For now, docs are hosted in a single well-structured markdown file: [`./DOCS.md`](./DOCS.md).

- [Package Overview](./DOCS.md#overview)
- [`jazz-react` API](./DOCS.md#jazz-react)
- [`cojson` API](./DOCS.md#cojson)
- [`jazz-browser-media-images` API](./DOCS.md#jazz-browser-media-images)


In the future we'll build a dedicated docs page on the Jazz homepage.

----

Copyright 2023 &mdash; Garden Computing, Inc.