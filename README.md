# Jazz - instant sync

Homepage: [jazz.tools](https://jazz.tools) &mdash; Docs: [DOCS.md](./DOCS.md) &mdash; Community & support: [Discord](https://discord.gg/utDMjHYg42) &mdash; Updates: [Twitter](https://twitter.com/jazz_tools) & [Email](https://gcmp.io/news)

**Jazz is an open-source toolkit for building apps with *secure sync.***

Quickly build and ship apps with:

- **Cross-device sync**
- **Collaborative features** (incl. real-time multiplayer)
- **Instantly reacting UIs**
- Local-first storage & offline support
- File upload and real-time media streaming

*Build even faster with
**[Jazz Global Mesh](https://jazz.tools/mesh),** a globally distributed mesh of servers providing:*

 - *Ultra-low-latency sync (with geo-aware edge caching and optimal routing)*
 - *Low-cost, reliable storage*

*Jazz Global Mesh is free for small volumes of data. It's the default syncing peer, so you can  **start building multi-device/multi-user apps with persistent data in minutes,** using only frontend code!*

## What is "secure sync"?

**Sync** means that, *instead of making API requests:*

- **Read and write data as if it was local** &mdash; from anywhere in your app.
- **Always have data synced to wherever it's needed, instantly:** to other devices of the same user, to other users, to your backend, to your local machine for debugging, etc.

**Secure** means that, *instead of relying on your API or DB for access control:*

- **Set fine-grained, role-based permissions that are *synced along with* your data and *verifiably enforced* on every client,** using encryption & signatures
- **Change roles dynamically** for evolving teams, expiring invite links and more.

# What's special about Jazz?

- **Jazz is a batteries-included, vertically integrated toolkit,** offering everything you need to build an app, including auth, permissions, data model, blob storage, file uploads, real-time media streaming and more.
- **Jazz has a small API surface of only a few abstractions to learn,** which combine in powerful ways to implement the features mentioned above.
- **Jazz loads and caches data granularly, only when it's needed,** combining *local-first* instant UI reactivity and offline support with the on-demand data efficiency of conventional APIs
- **Jazz supports end-to-end encryption, but doesn't require it,** allowing you to either manage your user's secret keys for them (based on existing auth flows) or letting your users
- **Jazz is based on CoJSON, a soon-to-be open standard,** which means that there will be a whole ecosystem of compatible libraries and frameworks in a variety of environments &mdash; and it's easy to achieve (secure) interop between Jazz/CoJSON-based apps and services.

# Getting started

**Detailed guides are coming soon...**

**For now the best tutorial is the walkthrough of the [Todo List Example App](#todo-list).**

## Scenarios

### Building a new, entirely sync-based React app

1. Define your data model with [cojson Collaborative Values (CoValues)](./DOCS.md/#covalue-interface-in-cojson).
2. Implement permission logic using [cojson Groups](./DOCS.md/#group-class-in-cojson).
3. Build a user interface with [jazz-react](./DOCS.md/#jazz-react)'s reactive [synced queries](./DOCS.md/#usesyncedqueryid-function-in-jazz-react).

### Gradually adding sync to an existing React app

Gradually migrate app features to use sync:

1. Define data model for small aspect of your app with [cojson Collaborative Values (CoValues)](./DOCS.md/#covalue-interface-in-cojson).
    - Schema adapters/importers for Prisma/Drizzle/PostgreSQL introspection coming soon.
2. Map existing permission logic with [cojson Groups](./DOCS.md/#group-class-in-cojson) & integrate existing auth.
    - Auth integrations coming soon.
3. Replace some of the React state and API requests in your UI with [jazz-react](./DOCS.md/#jazz-react)'s reactive [synced queries](./DOCS.md/#usesyncedqueryid-function-in-jazz-react).

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


# [Documentation & API Reference](DOCS.md)

For now, docs are hosted in a single well-structured markdown file.

In the future we'll build a dedicated docs page on the Jazz homepage.

----

Copyright 2023: Garden Computing, Inc.