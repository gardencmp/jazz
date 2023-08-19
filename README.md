# Jazz - instant sync

Homepage: [jazz.tools](https://jazz.tools) &mdash; [Discord](https://discord.gg/utDMjHYg42)

Jazz is an open-source toolkit for *permissioned telepathic data.*

- Ship faster & simplify your frontend and backend
- Get cross-device sync, real-time collaboration & offline support for free

[Jazz Global Mesh](https://jazz.tools/mesh) is serverless sync & storage for Jazz apps. (currently free!)



## What is Permissioned Telepathic Data?

**Telepathic** means:

- **Read and write data as if it was local,** from anywhere in your app.
- **Always have that data synced, instantly.** Across devices of the same user &mdash; or to other users (coming soon: to your backend, workers, etc.)

**Permissioned** means:

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

# API Reference

Note: Since it's early days, this is the only source of documentation so far.

If you want to build something with Jazz, [join the Jazz Discord](https://discord.gg/utDMjHYg42) for encouragement and help!

## Overview: Main Packages

**`cojson`**

A library implementing abstractions and protocols for "Collaborative JSON". This will soon be standardized and forms the basis of permissioned telepathic data.

**`jazz-react`**

Provides you with everything you need to build react apps around CoJSON, including reactive hooks for telepathic data, local IndexedDB persistence, support for different auth providers and helpers for simple invite links for CoJSON groups.

### Supporting packages
<small>

**`cojson-simple-sync`**

A generic CoJSON sync server you can run locally if you don't want to use Jazz Global Mesh (the default sync backend, at `wss://sync.jazz.tools`)

**`jazz-browser`**

framework-agnostic primitives that allow you to use CoJSON in the browser. Used to implement `jazz-react`, will be used to implement bindings for other frameworks in the future.

**`jazz-react-auth-local`** (and `jazz-browser-auth-local`): A simple auth provider that stores cryptographic keys on user devices using WebAuthentication/Passkeys. Lets you build Jazz apps completely without a backend, with end-to-end encryption by default.

**`jazz-storage-indexeddb`**

Provides local, offline-capable persistence. Included and enabled in `jazz-react` by default.
</small>

## `CoJSON`

CoJSON is the core implementation of permissioned telepathic data. It provides abstractions for Collaborative JSON values ("`CoValues`"), groups for permission management and a protocol for syncing between nodes. Our goal is to standardise CoJSON soon and port it to other languages and platforms.

---

### `LocalNode`

A `LocalNode` represents a local view of a set of loaded `CoValue`s, from the perspective of a particular account (or primitive cryptographic agent).

A `LocalNode` can have peers that it syncs to, for example some form of local persistence, or a sync server, such as `sync.jazz.tools` (Jazz Global Mesh).

You typically get hold of a `LocalNode` using `jazz-react`'s `useJazz()`:

```typescript
const { localNode } = useJazz();
```

#### `LocalNode.load(id)`
```typescript
load<T extends ContentType>(id: CoID<T>): Promise<T>
```

Loads a CoValue's content, syncing from peers as necessary and resolving the returned promise once a first version has been loaded. See `ContentType.subscribe()` and `useTelepathicData` for listening to subsequent updates to the CoValue.

#### `LocalNode.loadProfile(id)`
```typescript
loadProfile(accountID: AccountID): Promise<Profile>
```

Loads a profile associated with an account. `Profile` is at least a `CoMap<{string: name}>`, but might contain other, app-specific properties.

#### `LocalNode.acceptInvite(valueOrGroup, inviteSecret)`
```typescript
acceptInvite<T extends ContentType>(
    valueOrGroup: CoID<T>,
    inviteSecret: InviteSecret
): Promise<void>
```

Accepts an invite for a group, or infers the group if given the `CoID` of a value owned by that group. Resolves upon successful joining of that group, at which point you should be able to `LocalNode.load` the value.

Invites can be created with `Group.createInvite(role)`.

#### `LocalNode.createGroup()`
```typescript
createGroup(): Group
```

Creates a new group (with the current account as the group's first admin).

---

### `Group`

A CoJSON group manages permissions of its members. A `Group` object exposes those capabilities and allows you to create new CoValues owned by that group.

(Internally, a `Group` is also just a `CoMap`, mapping member accounts to roles and containing some state management for making cryptographic keys available to current members)

#### `Group.id`

Returns the `CoID` of the `Group`.

#### `Group.roleOf(accountID)`

```typescript
roleOf(accountID: AccountID): "reader" | "writer" | "admin" | undefined
```

Returns the current role of a given account.

#### `Group.myRole()`

```typescript
myRole(accountID: AccountID): "reader" | "writer" | "admin" | undefined
```

Returns the role of the current account in the group.

#### `Group.addMember(accountID, role)`

```typescript
addMember(
  accountID: AccountIDOrAgentID,
  role:  "reader" | "writer" | "admin"
)
```

Directly grants a new member a role in the group. The current account must be an admin to be able to do so. Throws otherwise.

#### `Group.createInvite(role)`

```typescript
createInvite(role: "reader" | "writer" | "admin"): InviteSecret
```

Creates an invite for new members to indirectly join the group, allowing them to grant themselves the specified role with the InviteSecret (a string starting with "inviteSecret_") - use `LocalNode.acceptInvite()` for this purpose.

#### `Group.removeMember(accountID)`

```typescript
removeMember(accountID: AccountID)
```

Strips the specified member of all roles (preventing future writes) and rotates the read encryption key for that group (preventing reads of new content, including in covalues owned by this group)

#### `Group.createMap(meta?)`
```typescript
createMap<
    M extends { [key: string]: JsonValue },
    Meta extends JsonObject | null = null
>(meta?: Meta): CoMap<M, Meta>
```

Creates a new `CoMap` within this group, with the specified inner content type `M` and optional static metadata.

#### `Group.createList(meta?)` (coming soon)
#### `Group.createStream(meta?)` (coming soon)
#### `Group.createStatic(meta)` (coming soon)

---
### `CoValue` ContentType: `CoMap`

```typescript
class CoMap<
    M extends { [key: string]: JsonValue; },
    Meta extends JsonObject | null = null,
>
```

#### `CoMap.id`

```typescript
id: CoID<CoMap<M, Meta>>
```

Returns the CoMap's (precisely typed) `CoID`

#### `CoMap.keys()`

```typescript
keys(): (keyof M & string)[]
```

#### `CoMap.get(key)`

```typescript
get<K extends keyof M>(key: K): M[K] | undefined
```

Returns the current value for the given key.

#### `CoMap.getLastEditor(key)`

```typescript
getLastEditor<K extends keyof M>(key: K): AccountID | undefined
```

Returns the accountID of the last account to modify the value for the given key.

#### `CoMap.toJSON()`

```typescript
toJSON(): JsonObject
```

Returns a JSON representation of the state of the CoMap.

#### `CoMap.subscribe(listener)`

```typescript
subscribe(
  listener: (coMap: CoMap<M, Meta>) => void
): () => void
```
Lets you subscribe to future updates to this CoMap (whether made locally or by other users). Takes a listener function that will be called with the current state for each update. Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoMap`.

#### `CoMap.edit(editable => {...})`

```typescript
edit(changer: (editable: WriteableCoMap<M, Meta>) => void): CoMap<M, Meta>
```

Lets you apply edits to a `CoMap`, inside the changer callback, which receives a `WriteableCoMap`. A `WritableCoMap` has all the same methods as a `CoMap`, but all edits made to it with `set` or `delete` are reflected in it immediately - so it behaves mutably, whereas a `CoMap` is always immutable (you need to use `subscribe` to receive new versions of it).

```typescript
export class WriteableCoMap<
    M extends { [key: string]: JsonValue; },
    Meta extends JsonObject | null = null,
> extends CoMap<M, Meta>
```

#### `WritableCoMap.set(key, value)`

```typescript
set<K extends keyof M>(
  key: K,
  value: M[K],
  privacy: "private" | "trusting" = "private"
): void
```

Sets a new value for the given key.

If `privacy` is `"private"` **(default)**, both `key` and `value` are encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, both `key` and `value` are stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.

#### `WritableCoMap.delete(key)`

```typescript
delete<K extends keyof M>(
  key: K,
  privacy: "private" | "trusting" = "private"
): void
```

Deletes the value for the given key (setting it to undefined).

If `privacy` is `"private"` **(default)**, `key` is encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, `key` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.

---
### `CoValue` ContentType: `CoList` (coming soon)

---
### `CoValue` ContentType: `CoStram` (coming soon)

---
### `CoValue` ContentType: `Static` (coming soon)
---

## `jazz-react`
---
### `<WithJazz>`

TODO, see [`examples/todo`](./examples/todo/) for now

---
### `useJazz()`

TODO, see [`examples/todo`](./examples/todo/) for now

---
### `useTelepathicData(coID)`

TODO, see [`examples/todo`](./examples/todo/) for now

---
### `useProfile(accountID)`

TODO, see [`examples/todo`](./examples/todo/) for now