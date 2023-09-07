# Jazz - instant sync

Homepage: [jazz.tools](https://jazz.tools) &mdash; [Discord](https://discord.gg/utDMjHYg42)

Jazz is an open-source toolkit for *secure telepathic data.*

- Ship faster & simplify your frontend and backend
- Get cross-device sync, real-time collaboration & offline support for free

[Jazz Global Mesh](https://jazz.tools/mesh) is serverless sync & storage for Jazz apps. (currently free!)



## What is Secure Telepathic Data?

**Telepathic** means:

- **Read and write data as if it was local,** from anywhere in your app.
- **Always have that data synced, instantly.** Across devices of the same user &mdash; or to other users (coming soon: to your backend, workers, etc.)

**Secure** means:

- **Fine-grained, role-based permissions are *baked into* your data.**
- **Permissions are enforced everywhere, locally.** (using cryptography instead of through an API)
- Roles can be changed dynamically, supporting changing teams, invite links and more.

## How to build an app with Jazz?

### Building a new app, completely with Jazz

It's still a bit early, but these are the rough steps:

1. Define your data model with [CoJSON Values](#cojson).
2. Implement permission logic using [CoJSON Groups](#group).
3. Hook up a user interface with [jazz-react](#jazz-react).

The best example is currently the [Todo List app](#example-app-todo-list).

### Gradually adding Jazz to an existing app

Coming soon: Jazz will support gradual adoption by integrating with your existing UI, auth and database.

## Example App: Todo List

The best example of Jazz is currently the Todo List app.

- Live version: https://example-todo.jazz.tools
- Source code: [`./examples/todo`](./examples/todo). See the README there for a walk-through and running instructions.

# Documentation

Note: Since it's early days, this is the only source of documentation so far.

If you want to build something with Jazz, [join the Jazz Discord](https://discord.gg/utDMjHYg42) for encouragement and help!

## Overview: Main Packages

**`cojson`** → [DOCS](./DOCS.md#cojson)

A library implementing abstractions and protocols for "Collaborative JSON". This will soon be standardized and forms the basis of secure telepathic data.

**`jazz-react`** → [DOCS](./DOCS.md#jazz-react)

Provides you with everything you need to build react apps around CoJSON, including reactive hooks for telepathic data, local IndexedDB persistence, support for different auth providers and helpers for simple invite links for CoJSON groups.

### Supporting packages
<small>

**`cojson-simple-sync`**

A generic CoJSON sync server you can run locally if you don't want to use Jazz Global Mesh (the default sync backend, at `wss://sync.jazz.tools`)

**`jazz-browser`**  → [DOCS](./DOCS.md#jazz-browser)

framework-agnostic primitives that allow you to use CoJSON in the browser. Used to implement `jazz-react`, will be used to implement bindings for other frameworks in the future.

**`jazz-react-auth-local`** (and `jazz-browser-auth-local`): A simple auth provider that stores cryptographic keys on user devices using WebAuthentication/Passkeys. Lets you build Jazz apps completely without a backend, with end-to-end encryption by default.

**`jazz-storage-indexeddb`**

Provides local, offline-capable persistence. Included and enabled in `jazz-react` by default.
</small>