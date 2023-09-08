# cojson



----

## `LocalNode` (class in `cojson`)

```typescript
export class LocalNode {...}
```
A `LocalNode` represents a local view of a set of loaded `CoValue`s, from the perspective of a particular account (or primitive cryptographic agent).

A `LocalNode` can have peers that it syncs to, for example some form of local persistence, or a sync server, such as `sync.jazz.tools` (Jazz Global Mesh).

##### Example:

You typically get hold of a `LocalNode` using `jazz-react`'s `useJazz()`:

```typescript
const { localNode } = useJazz();
```

### Constructors

<details>
<summary><code>new LocalNode(account, currentSessionID)</code>  (undocumented)</summary>

```typescript
new LocalNode(
  account: GeneralizedControlledAccount,
  currentSessionID: SessionID
): LocalNode
```
TODO: document

</details>



### Properties





<details>
<summary><code>localNode.currentSessionID</code>  (undocumented)</summary>

```typescript
localNode.currentSessionID: SessionID
```
TODO: document

</details>



<details>
<summary><code>localNode.sync</code>  (undocumented)</summary>

```typescript
localNode.sync: SyncManager
```
TODO: document

</details>



### Methods

<details>
<summary><code>LocalNode.withNewlyCreatedAccount(name, initialAgentSecret?)</code>  (undocumented)</summary>

```typescript
LocalNode.withNewlyCreatedAccount(
  name: string,
  initialAgentSecret?: AgentSecret = ...
): {node: LocalNode, accountID: AccountID, accountSecret: AgentSecret, sessionID: SessionID}
```
TODO: document

</details>



<details>
<summary><code>LocalNode.withLoadedAccount(accountID, accountSecret, sessionID, peersToLoadFrom)</code>  (undocumented)</summary>

```typescript
LocalNode.withLoadedAccount(
  accountID: AccountID,
  accountSecret: AgentSecret,
  sessionID: SessionID,
  peersToLoadFrom: Peer[]
): Promise<LocalNode>
```
TODO: document

</details>







<details>
<summary><code>localNode.load(id)</code>  </summary>

```typescript
localNode.load<T extends CoValueImpl>(
  id: CoID<T>
): Promise<T>
```
Loads a CoValue's content, syncing from peers as necessary and resolving the returned
promise once a first version has been loaded. See `coValue.subscribe()` and `node.useTelepathicData()`
for listening to subsequent updates to the CoValue.



</details>



<details>
<summary><code>localNode.loadProfile(id)</code>  </summary>

```typescript
localNode.loadProfile(
  id: AccountID
): Promise<Profile>
```
Loads a profile associated with an account. `Profile` is at least a `CoMap<{string: name}>`,
but might contain other, app-specific properties.



</details>



<details>
<summary><code>localNode.acceptInvite(groupOrOwnedValueID, inviteSecret)</code>  (undocumented)</summary>

```typescript
localNode.acceptInvite<T extends CoValueImpl>(
  groupOrOwnedValueID: CoID<T>,
  inviteSecret: InviteSecret
): Promise<void>
```
TODO: document

</details>











<details>
<summary><code>localNode.createGroup()</code>  </summary>

```typescript
localNode.createGroup(): Group
```
Creates a new group (with the current account as the group's first admin).



</details>





----

## `Group` (class in `cojson`)

```typescript
export class Group {...}
```
A `Group` is a scope for permissions of its members (`"reader" | "writer" | "admin"`), applying to objects owned by that group.

 A `Group` object exposes methods for permission management and allows you to create new CoValues owned by that group.

 (Internally, a `Group` is also just a `CoMap`, mapping member accounts to roles and containing some
 state management for making cryptographic keys available to current members)

##### Example:

You typically get a group from a CoValue that you already have loaded:

 ```typescript
 const group = coMap.group;
 ```

##### Example:

Or, you can create a new group with a `LocalNode`:

 ```typescript
 const localNode.createGroup();
 ```

### Constructors



### Properties

<details>
<summary><code>group.underlyingMap</code>  (undocumented)</summary>

```typescript
group.underlyingMap: CoMap<GroupContent, null | JsonObject>
```
TODO: document

</details>





### Accessors

<details>
<summary><code>group.id</code>  (undocumented)</summary>

```typescript
get group.id(): CoID<CoMap<GroupContent, null | JsonObject>>
```
TODO: document

</details>



### Methods

<details>
<summary><code>group.roleOf(accountID)</code>  </summary>

```typescript
group.roleOf(
  accountID: AccountID
): undefined | Role
```
Returns the current role of a given account.



</details>





<details>
<summary><code>group.myRole()</code>  </summary>

```typescript
group.myRole(): undefined | Role
```
Returns the role of the current account in the group.



</details>



<details>
<summary><code>group.addMember(accountID, role)</code>  </summary>

```typescript
group.addMember(
  accountID: AccountID,
  role: Role
): void
```
Directly grants a new member a role in the group. The current account must be an
admin to be able to do so. Throws otherwise.



</details>







<details>
<summary><code>group.removeMember(accountID)</code>  </summary>

```typescript
group.removeMember(
  accountID: AccountID
): void
```
Strips the specified member of all roles (preventing future writes in
 the group and owned values) and rotates the read encryption key for that group
(preventing reads of new content in the group and owned values)



</details>





<details>
<summary><code>group.createInvite(role)</code>  </summary>

```typescript
group.createInvite(
  role: "reader" | "writer" | "admin"
): InviteSecret
```
Creates an invite for new members to indirectly join the group, allowing them to grant themselves the specified role with the InviteSecret (a string starting with "inviteSecret_") - use `LocalNode.acceptInvite()` for this purpose.



</details>



<details>
<summary><code>group.createMap(meta)</code>  </summary>

```typescript
group.createMap<M extends CoMap<{ [key: string]: JsonValue }, null | JsonObject>>(
  meta: M["meta"]
): M
```
Creates a new `CoMap` within this group, with the specified specialized
 `CoMap` type `M` and optional static metadata.



</details>



<details>
<summary><code>group.createList(meta)</code>  </summary>

```typescript
group.createList<L extends CoList<JsonValue, null | JsonObject>>(
  meta: L["meta"]
): L
```
Creates a new `CoList` within this group, with the specified specialized
`CoList` type `L` and optional static metadata.



</details>



<details>
<summary><code>group.createStream(meta)</code>  (undocumented)</summary>

```typescript
group.createStream<C extends CoStream<JsonValue, null | JsonObject>>(
  meta: C["meta"]
): C
```
TODO: document

</details>



<details>
<summary><code>group.createBinaryStream(meta?)</code>  (undocumented)</summary>

```typescript
group.createBinaryStream<C extends BinaryCoStream<BinaryCoStreamMeta>>(
  meta?: C["meta"] = ...
): C
```
TODO: document

</details>





----

## `CoMap` (class in `cojson`)

```typescript
export class CoMap<M extends { [key: string]: JsonValue }, Meta extends JsonObject | null> implements ReadableCoValue {...}
```
A collaborative map with precise shape `M` and optional static metadata `Meta`



### Constructors



### Properties

<details>
<summary><code>coMap.id</code>  </summary>

```typescript
coMap.id: CoID<CoMap<MapM<M>, Meta>>
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>coMap.type</code>  </summary>

```typescript
coMap.type: "comap"
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>coMap.core</code>  (undocumented)</summary>

```typescript
coMap.core: CoValueCore
```
TODO: document

</details>





### Accessors

<details>
<summary><code>coMap.meta</code>  </summary>

```typescript
get coMap.meta(): Meta
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>coMap.group</code>  </summary>

```typescript
get coMap.group(): Group
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>



### Methods



<details>
<summary><code>coMap.keys()</code>  (undocumented)</summary>

```typescript
coMap.keys(): MapK<M>[]
```
TODO: document

</details>



<details>
<summary><code>coMap.get(key)</code>  </summary>

```typescript
coMap.get<K extends string>(
  key: K
): undefined | M[K]
```
Returns the current value for the given key.



</details>



<details>
<summary><code>coMap.getAtTime(key, time)</code>  (undocumented)</summary>

```typescript
coMap.getAtTime<K extends string>(
  key: K,
  time: number
): undefined | M[K]
```
TODO: document

</details>



<details>
<summary><code>coMap.whoEdited(key)</code>  </summary>

```typescript
coMap.whoEdited<K extends string>(
  key: K
): undefined | AccountID
```
Returns the accountID of the last account to modify the value for the given key.



</details>



<details>
<summary><code>coMap.getLastTxID(key)</code>  (undocumented)</summary>

```typescript
coMap.getLastTxID<K extends string>(
  key: K
): undefined | TransactionID
```
TODO: document

</details>



<details>
<summary><code>coMap.getLastEntry(key)</code>  (undocumented)</summary>

```typescript
coMap.getLastEntry<K extends string>(
  key: K
): undefined | {at: number, txID: TransactionID, value: M[K]}
```
TODO: document

</details>



<details>
<summary><code>coMap.getHistory(key)</code>  (undocumented)</summary>

```typescript
coMap.getHistory<K extends string>(
  key: K
): {at: number, txID: TransactionID, value: undefined | M[K]}[]
```
TODO: document

</details>



<details>
<summary><code>coMap.toJSON()</code>  </summary>

```typescript
coMap.toJSON(): JsonObject
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary><code>coMap.subscribe(listener)</code>  </summary>

```typescript
coMap.subscribe(
  listener: (coMap: CoMap<M, Meta>) => void
): () => void
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>



<details>
<summary><code>coMap.edit(changer)</code>  </summary>

```typescript
coMap.edit(
  changer: (editable: WriteableCoMap<M, Meta>) => void
): CoMap<M, Meta>
```
Lets you apply edits to a `CoValue`, inside the changer callback, which receives a `WriteableCoValue`.

 A `WritableCoValue` has all the same methods as a `CoValue`, but all edits made to it (with its additional mutator methods)
 are reflected in it immediately - so it behaves mutably, whereas a `CoValue` is always immutable
 (you need to use `subscribe` to receive new versions of it).



</details>



----

## `WriteableCoMap` (class in `cojson`)

```typescript
export class WriteableCoMap<M extends { [key: string]: JsonValue }, Meta extends JsonObject | null> extends CoMap<M, Meta> implements WriteableCoValue {...}
```
A collaborative map with precise shape `M` and optional static metadata `Meta`



### Constructors



### Properties

<details>
<summary><code>writeableCoMap.id</code> (from <code>CoMap</code>)  </summary>

```typescript
writeableCoMap.id: CoID<CoMap<MapM<M>, Meta>>
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>writeableCoMap.type</code> (from <code>CoMap</code>)  </summary>

```typescript
writeableCoMap.type: "comap"
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>writeableCoMap.core</code> (from <code>CoMap</code>)  (undocumented)</summary>

```typescript
writeableCoMap.core: CoValueCore
```
TODO: document

</details>





### Accessors

<details>
<summary><code>writeableCoMap.meta</code> (from <code>CoMap</code>)  </summary>

```typescript
get writeableCoMap.meta(): Meta
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>writeableCoMap.group</code> (from <code>CoMap</code>)  </summary>

```typescript
get writeableCoMap.group(): Group
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>



### Methods



<details>
<summary><code>writeableCoMap.set(key, value, privacy?)</code>  </summary>

```typescript
writeableCoMap.set<K extends string>(
  key: K,
  value: M[K],
  privacy?: "private" | "trusting" = "private"
): void
```
Sets a new value for the given key.

If `privacy` is `"private"` **(default)**, both `key` and `value` are encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, both `key` and `value` are stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary><code>writeableCoMap.delete(key, privacy?)</code>  </summary>

```typescript
writeableCoMap.delete(
  key: MapK<M>,
  privacy?: "private" | "trusting" = "private"
): void
```
Deletes the value for the given key (setting it to undefined).

If `privacy` is `"private"` **(default)**, `key` is encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, `key` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>





<details>
<summary><code>writeableCoMap.keys()</code> (from <code>CoMap</code>)  (undocumented)</summary>

```typescript
writeableCoMap.keys(): MapK<M>[]
```
TODO: document

</details>



<details>
<summary><code>writeableCoMap.get(key)</code> (from <code>CoMap</code>)  </summary>

```typescript
writeableCoMap.get<K extends string>(
  key: K
): undefined | M[K]
```
Returns the current value for the given key.



</details>



<details>
<summary><code>writeableCoMap.getAtTime(key, time)</code> (from <code>CoMap</code>)  (undocumented)</summary>

```typescript
writeableCoMap.getAtTime<K extends string>(
  key: K,
  time: number
): undefined | M[K]
```
TODO: document

</details>



<details>
<summary><code>writeableCoMap.whoEdited(key)</code> (from <code>CoMap</code>)  </summary>

```typescript
writeableCoMap.whoEdited<K extends string>(
  key: K
): undefined | AccountID
```
Returns the accountID of the last account to modify the value for the given key.



</details>



<details>
<summary><code>writeableCoMap.getLastTxID(key)</code> (from <code>CoMap</code>)  (undocumented)</summary>

```typescript
writeableCoMap.getLastTxID<K extends string>(
  key: K
): undefined | TransactionID
```
TODO: document

</details>



<details>
<summary><code>writeableCoMap.getLastEntry(key)</code> (from <code>CoMap</code>)  (undocumented)</summary>

```typescript
writeableCoMap.getLastEntry<K extends string>(
  key: K
): undefined | {at: number, txID: TransactionID, value: M[K]}
```
TODO: document

</details>



<details>
<summary><code>writeableCoMap.getHistory(key)</code> (from <code>CoMap</code>)  (undocumented)</summary>

```typescript
writeableCoMap.getHistory<K extends string>(
  key: K
): {at: number, txID: TransactionID, value: undefined | M[K]}[]
```
TODO: document

</details>



<details>
<summary><code>writeableCoMap.toJSON()</code> (from <code>CoMap</code>)  </summary>

```typescript
writeableCoMap.toJSON(): JsonObject
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary><code>writeableCoMap.subscribe(listener)</code> (from <code>CoMap</code>)  </summary>

```typescript
writeableCoMap.subscribe(
  listener: (coMap: CoMap<M, Meta>) => void
): () => void
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>



----

## `CoList` (class in `cojson`)

```typescript
export class CoList<T extends JsonValue, Meta extends JsonObject | null> implements ReadableCoValue {...}
```
TODO: document

### Constructors



### Properties

<details>
<summary><code>coList.id</code>  </summary>

```typescript
coList.id: CoID<CoList<T, Meta>>
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>coList.type</code>  </summary>

```typescript
coList.type: "colist"
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>coList.core</code>  (undocumented)</summary>

```typescript
coList.core: CoValueCore
```
TODO: document

</details>











### Accessors

<details>
<summary><code>coList.meta</code>  </summary>

```typescript
get coList.meta(): Meta
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>coList.group</code>  </summary>

```typescript
get coList.group(): Group
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>



### Methods



<details>
<summary><code>coList.get(idx)</code>  </summary>

```typescript
coList.get(
  idx: number
): undefined | T
```
Get the item currently at `idx`.



</details>



<details>
<summary><code>coList.asArray()</code>  </summary>

```typescript
coList.asArray(): T[]
```
Returns the current items in the CoList as an array.



</details>



<details>
<summary><code>coList.entries()</code>  (undocumented)</summary>

```typescript
coList.entries(): {value: T, madeAt: number, opID: OpID}[]
```
TODO: document

</details>





<details>
<summary><code>coList.whoInserted(idx)</code>  </summary>

```typescript
coList.whoInserted(
  idx: number
): undefined | AccountID
```
Returns the accountID of the account that inserted value at the given index.



</details>



<details>
<summary><code>coList.toJSON()</code>  </summary>

```typescript
coList.toJSON(): T[]
```
Returns the current items in the CoList as an array. (alias of `asArray`)



</details>



<details>
<summary><code>coList.map(mapper)</code>  (undocumented)</summary>

```typescript
coList.map<U>(
  mapper: (value: T,idx: number) => U
): U[]
```
TODO: document

</details>



<details>
<summary><code>coList.filter(predicate)</code>  (undocumented)</summary>

```typescript
coList.filter<U extends JsonValue>(
  predicate: (value: T,idx: number) => COMPLEX_TYPE_predicate
): U[]
```
TODO: document

</details>



<details>
<summary><code>coList.reduce(reducer, initialValue)</code>  (undocumented)</summary>

```typescript
coList.reduce<U>(
  reducer: (accumulator: U,value: T,idx: number) => U,
  initialValue: U
): U
```
TODO: document

</details>



<details>
<summary><code>coList.subscribe(listener)</code>  </summary>

```typescript
coList.subscribe(
  listener: (coMap: CoList<T, Meta>) => void
): () => void
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>



<details>
<summary><code>coList.edit(changer)</code>  </summary>

```typescript
coList.edit(
  changer: (editable: WriteableCoList<T, Meta>) => void
): CoList<T, Meta>
```
Lets you apply edits to a `CoValue`, inside the changer callback, which receives a `WriteableCoValue`.

 A `WritableCoValue` has all the same methods as a `CoValue`, but all edits made to it (with its additional mutator methods)
 are reflected in it immediately - so it behaves mutably, whereas a `CoValue` is always immutable
 (you need to use `subscribe` to receive new versions of it).



</details>



----

## `WriteableCoList` (class in `cojson`)

```typescript
export class WriteableCoList<T extends JsonValue, Meta extends JsonObject | null> extends CoList<T, Meta> implements WriteableCoValue {...}
```
TODO: document

### Constructors



### Properties

<details>
<summary><code>writeableCoList.id</code> (from <code>CoList</code>)  </summary>

```typescript
writeableCoList.id: CoID<CoList<T, Meta>>
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>writeableCoList.type</code> (from <code>CoList</code>)  </summary>

```typescript
writeableCoList.type: "colist"
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>writeableCoList.core</code> (from <code>CoList</code>)  (undocumented)</summary>

```typescript
writeableCoList.core: CoValueCore
```
TODO: document

</details>











### Accessors

<details>
<summary><code>writeableCoList.meta</code> (from <code>CoList</code>)  </summary>

```typescript
get writeableCoList.meta(): Meta
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>writeableCoList.group</code> (from <code>CoList</code>)  </summary>

```typescript
get writeableCoList.group(): Group
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>



### Methods



<details>
<summary><code>writeableCoList.append(after, value, privacy?)</code>  </summary>

```typescript
writeableCoList.append(
  after: number,
  value: T,
  privacy?: "private" | "trusting" = "private"
): void
```
Appends a new item after index `after`.

If `privacy` is `"private"` **(default)**, both `value` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, both `value` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary><code>writeableCoList.push(value, privacy?)</code>  </summary>

```typescript
writeableCoList.push(
  value: T,
  privacy?: "private" | "trusting" = "private"
): void
```
Pushes a new item to the end of the list.

If `privacy` is `"private"` **(default)**, both `value` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, both `value` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary><code>writeableCoList.prepend(before, value, privacy?)</code>  </summary>

```typescript
writeableCoList.prepend(
  before: number,
  value: T,
  privacy?: "private" | "trusting" = "private"
): void
```
Prepends a new item before index `before`.

If `privacy` is `"private"` **(default)**, both `value` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, both `value` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary><code>writeableCoList.delete(at, privacy?)</code>  </summary>

```typescript
writeableCoList.delete(
  at: number,
  privacy?: "private" | "trusting" = "private"
): void
```
Deletes the item at index `at` from the list.

If `privacy` is `"private"` **(default)**, the fact of this deletion is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, the fact of this deletion is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>





<details>
<summary><code>writeableCoList.get(idx)</code> (from <code>CoList</code>)  </summary>

```typescript
writeableCoList.get(
  idx: number
): undefined | T
```
Get the item currently at `idx`.



</details>



<details>
<summary><code>writeableCoList.asArray()</code> (from <code>CoList</code>)  </summary>

```typescript
writeableCoList.asArray(): T[]
```
Returns the current items in the CoList as an array.



</details>



<details>
<summary><code>writeableCoList.entries()</code> (from <code>CoList</code>)  (undocumented)</summary>

```typescript
writeableCoList.entries(): {value: T, madeAt: number, opID: OpID}[]
```
TODO: document

</details>



<details>
<summary><code>writeableCoList.whoInserted(idx)</code> (from <code>CoList</code>)  </summary>

```typescript
writeableCoList.whoInserted(
  idx: number
): undefined | AccountID
```
Returns the accountID of the account that inserted value at the given index.



</details>



<details>
<summary><code>writeableCoList.toJSON()</code> (from <code>CoList</code>)  </summary>

```typescript
writeableCoList.toJSON(): T[]
```
Returns the current items in the CoList as an array. (alias of `asArray`)



</details>



<details>
<summary><code>writeableCoList.map(mapper)</code> (from <code>CoList</code>)  (undocumented)</summary>

```typescript
writeableCoList.map<U>(
  mapper: (value: T,idx: number) => U
): U[]
```
TODO: document

</details>



<details>
<summary><code>writeableCoList.filter(predicate)</code> (from <code>CoList</code>)  (undocumented)</summary>

```typescript
writeableCoList.filter<U extends JsonValue>(
  predicate: (value: T,idx: number) => COMPLEX_TYPE_predicate
): U[]
```
TODO: document

</details>



<details>
<summary><code>writeableCoList.reduce(reducer, initialValue)</code> (from <code>CoList</code>)  (undocumented)</summary>

```typescript
writeableCoList.reduce<U>(
  reducer: (accumulator: U,value: T,idx: number) => U,
  initialValue: U
): U
```
TODO: document

</details>



<details>
<summary><code>writeableCoList.subscribe(listener)</code> (from <code>CoList</code>)  </summary>

```typescript
writeableCoList.subscribe(
  listener: (coMap: CoList<T, Meta>) => void
): () => void
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>



----

## `CoStream` (class in `cojson`)

```typescript
export class CoStream<T extends JsonValue, Meta extends JsonObject | null> implements ReadableCoValue {...}
```
TODO: document

### Constructors

<details>
<summary><code>new CoStream(core)</code>  (undocumented)</summary>

```typescript
new CoStream<T extends JsonValue, Meta extends null | JsonObject>(
  core: CoValueCore
): CoStream<T, Meta>
```
TODO: document

</details>



### Properties

<details>
<summary><code>coStream.id</code>  </summary>

```typescript
coStream.id: CoID<CoStream<T, Meta>>
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>coStream.type</code>  </summary>

```typescript
coStream.type: "costream"
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>coStream.core</code>  (undocumented)</summary>

```typescript
coStream.core: CoValueCore
```
TODO: document

</details>



<details>
<summary><code>coStream.items</code>  (undocumented)</summary>

```typescript
coStream.items: { [key: SessionID]: T[] }
```
TODO: document

</details>



### Accessors

<details>
<summary><code>coStream.meta</code>  </summary>

```typescript
get coStream.meta(): Meta
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>coStream.group</code>  </summary>

```typescript
get coStream.group(): Group
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>



### Methods



<details>
<summary><code>coStream.getSingleStream()</code>  (undocumented)</summary>

```typescript
coStream.getSingleStream(): undefined | T[]
```
TODO: document

</details>



<details>
<summary><code>coStream.toJSON()</code>  </summary>

```typescript
coStream.toJSON(): { [key: SessionID]: T[] }
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary><code>coStream.subscribe(listener)</code>  </summary>

```typescript
coStream.subscribe(
  listener: (coMap: CoStream<T, Meta>) => void
): () => void
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>



<details>
<summary><code>coStream.edit(changer)</code>  </summary>

```typescript
coStream.edit(
  changer: (editable: WriteableCoStream<T, Meta>) => void
): CoStream<T, Meta>
```
Lets you apply edits to a `CoValue`, inside the changer callback, which receives a `WriteableCoValue`.

 A `WritableCoValue` has all the same methods as a `CoValue`, but all edits made to it (with its additional mutator methods)
 are reflected in it immediately - so it behaves mutably, whereas a `CoValue` is always immutable
 (you need to use `subscribe` to receive new versions of it).



</details>



----

## `WriteableCoStream` (class in `cojson`)

```typescript
export class WriteableCoStream<T extends JsonValue, Meta extends JsonObject | null> extends CoStream<T, Meta> implements WriteableCoValue {...}
```
TODO: document

### Constructors

<details>
<summary><code>new WriteableCoStream(core)</code> (from <code>CoStream</code>)  (undocumented)</summary>

```typescript
new WriteableCoStream<T extends JsonValue, Meta extends null | JsonObject>(
  core: CoValueCore
): WriteableCoStream<T, Meta>
```
TODO: document

</details>



### Properties

<details>
<summary><code>writeableCoStream.id</code> (from <code>CoStream</code>)  </summary>

```typescript
writeableCoStream.id: CoID<CoStream<T, Meta>>
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>writeableCoStream.type</code> (from <code>CoStream</code>)  </summary>

```typescript
writeableCoStream.type: "costream"
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>writeableCoStream.core</code> (from <code>CoStream</code>)  (undocumented)</summary>

```typescript
writeableCoStream.core: CoValueCore
```
TODO: document

</details>



<details>
<summary><code>writeableCoStream.items</code> (from <code>CoStream</code>)  (undocumented)</summary>

```typescript
writeableCoStream.items: { [key: SessionID]: T[] }
```
TODO: document

</details>



### Accessors

<details>
<summary><code>writeableCoStream.meta</code> (from <code>CoStream</code>)  </summary>

```typescript
get writeableCoStream.meta(): Meta
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>writeableCoStream.group</code> (from <code>CoStream</code>)  </summary>

```typescript
get writeableCoStream.group(): Group
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>



### Methods



<details>
<summary><code>writeableCoStream.push(item, privacy?)</code>  (undocumented)</summary>

```typescript
writeableCoStream.push(
  item: T,
  privacy?: "private" | "trusting" = "private"
): void
```
TODO: document

</details>





<details>
<summary><code>writeableCoStream.getSingleStream()</code> (from <code>CoStream</code>)  (undocumented)</summary>

```typescript
writeableCoStream.getSingleStream(): undefined | T[]
```
TODO: document

</details>



<details>
<summary><code>writeableCoStream.toJSON()</code> (from <code>CoStream</code>)  </summary>

```typescript
writeableCoStream.toJSON(): { [key: SessionID]: T[] }
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary><code>writeableCoStream.subscribe(listener)</code> (from <code>CoStream</code>)  </summary>

```typescript
writeableCoStream.subscribe(
  listener: (coMap: CoStream<T, Meta>) => void
): () => void
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>



----

## `BinaryCoStream` (class in `cojson`)

```typescript
export class BinaryCoStream<Meta extends BinaryCoStreamMeta> extends CoStream<BinaryStreamItem, Meta> implements ReadableCoValue {...}
```
TODO: document

### Constructors

<details>
<summary><code>new BinaryCoStream(core)</code> (from <code>CoStream</code>)  (undocumented)</summary>

```typescript
new BinaryCoStream<Meta extends BinaryCoStreamMeta>(
  core: CoValueCore
): BinaryCoStream<Meta>
```
TODO: document

</details>



### Properties

<details>
<summary><code>binaryCoStream.id</code>  </summary>

```typescript
binaryCoStream.id: CoID<BinaryCoStream<Meta>>
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>binaryCoStream.type</code> (from <code>CoStream</code>)  </summary>

```typescript
binaryCoStream.type: "costream"
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>binaryCoStream.core</code> (from <code>CoStream</code>)  (undocumented)</summary>

```typescript
binaryCoStream.core: CoValueCore
```
TODO: document

</details>



<details>
<summary><code>binaryCoStream.items</code> (from <code>CoStream</code>)  (undocumented)</summary>

```typescript
binaryCoStream.items: { [key: SessionID]: T[] }
```
TODO: document

</details>



### Accessors

<details>
<summary><code>binaryCoStream.meta</code> (from <code>CoStream</code>)  </summary>

```typescript
get binaryCoStream.meta(): Meta
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>binaryCoStream.group</code> (from <code>CoStream</code>)  </summary>

```typescript
get binaryCoStream.group(): Group
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>



### Methods

<details>
<summary><code>binaryCoStream.getBinaryChunks()</code>  (undocumented)</summary>

```typescript
binaryCoStream.getBinaryChunks(): undefined | BinaryChunkInfo & {chunks: Uint8Array[], finished: boolean}
```
TODO: document

</details>



<details>
<summary><code>binaryCoStream.edit(changer)</code>  </summary>

```typescript
binaryCoStream.edit(
  changer: (editable: WriteableBinaryCoStream<Meta>) => void
): BinaryCoStream<Meta>
```
Lets you apply edits to a `CoValue`, inside the changer callback, which receives a `WriteableCoValue`.

 A `WritableCoValue` has all the same methods as a `CoValue`, but all edits made to it (with its additional mutator methods)
 are reflected in it immediately - so it behaves mutably, whereas a `CoValue` is always immutable
 (you need to use `subscribe` to receive new versions of it).



</details>





<details>
<summary><code>binaryCoStream.getSingleStream()</code> (from <code>CoStream</code>)  (undocumented)</summary>

```typescript
binaryCoStream.getSingleStream(): undefined | BinaryStreamItem[]
```
TODO: document

</details>



<details>
<summary><code>binaryCoStream.toJSON()</code> (from <code>CoStream</code>)  </summary>

```typescript
binaryCoStream.toJSON(): { [key: SessionID]: T[] }
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary><code>binaryCoStream.subscribe(listener)</code> (from <code>CoStream</code>)  </summary>

```typescript
binaryCoStream.subscribe(
  listener: (coMap: CoStream<BinaryStreamItem, Meta>) => void
): () => void
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>



----

## `WriteableBinaryCoStream` (class in `cojson`)

```typescript
export class WriteableBinaryCoStream<Meta extends BinaryCoStreamMeta> extends BinaryCoStream<Meta> implements WriteableCoValue {...}
```
TODO: document

### Constructors

<details>
<summary><code>new WriteableBinaryCoStream(core)</code> (from <code>BinaryCoStream</code>)  (undocumented)</summary>

```typescript
new WriteableBinaryCoStream<Meta extends BinaryCoStreamMeta>(
  core: CoValueCore
): WriteableBinaryCoStream<Meta>
```
TODO: document

</details>



### Properties

<details>
<summary><code>writeableBinaryCoStream.id</code> (from <code>BinaryCoStream</code>)  </summary>

```typescript
writeableBinaryCoStream.id: CoID<BinaryCoStream<Meta>>
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>writeableBinaryCoStream.type</code> (from <code>BinaryCoStream</code>)  </summary>

```typescript
writeableBinaryCoStream.type: "costream"
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>writeableBinaryCoStream.core</code> (from <code>BinaryCoStream</code>)  (undocumented)</summary>

```typescript
writeableBinaryCoStream.core: CoValueCore
```
TODO: document

</details>



<details>
<summary><code>writeableBinaryCoStream.items</code> (from <code>BinaryCoStream</code>)  (undocumented)</summary>

```typescript
writeableBinaryCoStream.items: { [key: SessionID]: T[] }
```
TODO: document

</details>



### Accessors

<details>
<summary><code>writeableBinaryCoStream.meta</code> (from <code>BinaryCoStream</code>)  </summary>

```typescript
get writeableBinaryCoStream.meta(): Meta
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>writeableBinaryCoStream.group</code> (from <code>BinaryCoStream</code>)  </summary>

```typescript
get writeableBinaryCoStream.group(): Group
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>



### Methods





<details>
<summary><code>writeableBinaryCoStream.startBinaryStream(settings, privacy?)</code>  (undocumented)</summary>

```typescript
writeableBinaryCoStream.startBinaryStream(
  settings: BinaryChunkInfo,
  privacy?: "private" | "trusting" = "private"
): void
```
TODO: document

</details>



<details>
<summary><code>writeableBinaryCoStream.pushBinaryStreamChunk(chunk, privacy?)</code>  (undocumented)</summary>

```typescript
writeableBinaryCoStream.pushBinaryStreamChunk(
  chunk: Uint8Array,
  privacy?: "private" | "trusting" = "private"
): void
```
TODO: document

</details>



<details>
<summary><code>writeableBinaryCoStream.endBinaryStream(privacy?)</code>  (undocumented)</summary>

```typescript
writeableBinaryCoStream.endBinaryStream(
  privacy?: "private" | "trusting" = "private"
): void
```
TODO: document

</details>



<details>
<summary><code>writeableBinaryCoStream.getBinaryChunks()</code> (from <code>BinaryCoStream</code>)  (undocumented)</summary>

```typescript
writeableBinaryCoStream.getBinaryChunks(): undefined | BinaryChunkInfo & {chunks: Uint8Array[], finished: boolean}
```
TODO: document

</details>





<details>
<summary><code>writeableBinaryCoStream.getSingleStream()</code> (from <code>BinaryCoStream</code>)  (undocumented)</summary>

```typescript
writeableBinaryCoStream.getSingleStream(): undefined | BinaryStreamItem[]
```
TODO: document

</details>



<details>
<summary><code>writeableBinaryCoStream.toJSON()</code> (from <code>BinaryCoStream</code>)  </summary>

```typescript
writeableBinaryCoStream.toJSON(): { [key: SessionID]: T[] }
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary><code>writeableBinaryCoStream.subscribe(listener)</code> (from <code>BinaryCoStream</code>)  </summary>

```typescript
writeableBinaryCoStream.subscribe(
  listener: (coMap: CoStream<BinaryStreamItem, Meta>) => void
): () => void
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>



----

## `CoValueCore` (class in `cojson`)

```typescript
export class CoValueCore {...}
```
TODO: document

### Constructors

<details>
<summary><code>new CoValueCore(header, node, internalInitSessions?)</code>  (undocumented)</summary>

```typescript
new CoValueCore(
  header: CoValueHeader,
  node: LocalNode,
  internalInitSessions?: { [key: SessionID]: SessionLog } = {}
): CoValueCore
```
TODO: document

</details>



### Properties

<details>
<summary><code>coValueCore.id</code>  (undocumented)</summary>

```typescript
coValueCore.id: TEMPLATE_LITERAL
```
TODO: document

</details>



<details>
<summary><code>coValueCore.node</code>  (undocumented)</summary>

```typescript
coValueCore.node: LocalNode
```
TODO: document

</details>



<details>
<summary><code>coValueCore.header</code>  (undocumented)</summary>

```typescript
coValueCore.header: CoValueHeader
```
TODO: document

</details>



<details>
<summary><code>coValueCore._sessions</code>  (undocumented)</summary>

```typescript
coValueCore._sessions: { [key: SessionID]: SessionLog }
```
TODO: document

</details>



<details>
<summary><code>coValueCore.listeners</code>  (undocumented)</summary>

```typescript
coValueCore.listeners: Set<(content: CoValueImpl) => void>
```
TODO: document

</details>



<details>
<summary><code>coValueCore._decryptionCache</code>  (undocumented)</summary>

```typescript
coValueCore._decryptionCache: { [key: Encrypted<JsonValue[], JsonValue>]: JsonValue[] | undefined }
```
TODO: document

</details>



<details>
<summary><code>coValueCore._cachedContent</code>  (undocumented)</summary>

```typescript
coValueCore._cachedContent: CoValueImpl
```
TODO: document

</details>



### Accessors

<details>
<summary><code>coValueCore.sessions</code>  (undocumented)</summary>

```typescript
get coValueCore.sessions(): Readonly<{ [key: SessionID]: SessionLog }>
```
TODO: document

</details>



<details>
<summary><code>coValueCore.meta</code>  (undocumented)</summary>

```typescript
get coValueCore.meta(): JsonValue
```
TODO: document

</details>



### Methods

<details>
<summary><code>coValueCore.testWithDifferentAccount(account, currentSessionID)</code>  (undocumented)</summary>

```typescript
coValueCore.testWithDifferentAccount(
  account: GeneralizedControlledAccount,
  currentSessionID: SessionID
): CoValueCore
```
TODO: document

</details>



<details>
<summary><code>coValueCore.knownState()</code>  (undocumented)</summary>

```typescript
coValueCore.knownState(): CoValueKnownState
```
TODO: document

</details>



<details>
<summary><code>coValueCore.nextTransactionID()</code>  (undocumented)</summary>

```typescript
coValueCore.nextTransactionID(): TransactionID
```
TODO: document

</details>



<details>
<summary><code>coValueCore.tryAddTransactions(sessionID, newTransactions, givenExpectedNewHash, newSignature)</code>  (undocumented)</summary>

```typescript
coValueCore.tryAddTransactions(
  sessionID: SessionID,
  newTransactions: Transaction[],
  givenExpectedNewHash: undefined | TEMPLATE_LITERAL,
  newSignature: TEMPLATE_LITERAL
): boolean
```
TODO: document

</details>



<details>
<summary><code>coValueCore.tryAddTransactionsAsync(sessionID, newTransactions, givenExpectedNewHash, newSignature)</code>  (undocumented)</summary>

```typescript
coValueCore.tryAddTransactionsAsync(
  sessionID: SessionID,
  newTransactions: Transaction[],
  givenExpectedNewHash: undefined | TEMPLATE_LITERAL,
  newSignature: TEMPLATE_LITERAL
): Promise<boolean>
```
TODO: document

</details>



<details>
<summary><code>coValueCore.subscribe(listener)</code>  (undocumented)</summary>

```typescript
coValueCore.subscribe(
  listener: (content: CoValueImpl) => void
): () => void
```
TODO: document

</details>



<details>
<summary><code>coValueCore.expectedNewHashAfter(sessionID, newTransactions)</code>  (undocumented)</summary>

```typescript
coValueCore.expectedNewHashAfter(
  sessionID: SessionID,
  newTransactions: Transaction[]
): {expectedNewHash: TEMPLATE_LITERAL, newStreamingHash: StreamingHash}
```
TODO: document

</details>



<details>
<summary><code>coValueCore.expectedNewHashAfterAsync(sessionID, newTransactions)</code>  (undocumented)</summary>

```typescript
coValueCore.expectedNewHashAfterAsync(
  sessionID: SessionID,
  newTransactions: Transaction[]
): Promise<{expectedNewHash: TEMPLATE_LITERAL, newStreamingHash: StreamingHash}>
```
TODO: document

</details>



<details>
<summary><code>coValueCore.makeTransaction(changes, privacy)</code>  (undocumented)</summary>

```typescript
coValueCore.makeTransaction(
  changes: JsonValue[],
  privacy: "private" | "trusting"
): boolean
```
TODO: document

</details>



<details>
<summary><code>coValueCore.getCurrentContent()</code>  (undocumented)</summary>

```typescript
coValueCore.getCurrentContent(): CoValueImpl
```
TODO: document

</details>



<details>
<summary><code>coValueCore.getValidSortedTransactions()</code>  (undocumented)</summary>

```typescript
coValueCore.getValidSortedTransactions(): DecryptedTransaction[]
```
TODO: document

</details>



<details>
<summary><code>coValueCore.getCurrentReadKey()</code>  (undocumented)</summary>

```typescript
coValueCore.getCurrentReadKey(): {secret: undefined | TEMPLATE_LITERAL, id: TEMPLATE_LITERAL}
```
TODO: document

</details>



<details>
<summary><code>coValueCore.getReadKey(keyID)</code>  (undocumented)</summary>

```typescript
coValueCore.getReadKey(
  keyID: TEMPLATE_LITERAL
): undefined | TEMPLATE_LITERAL
```
TODO: document

</details>



<details>
<summary><code>coValueCore.getGroup()</code>  (undocumented)</summary>

```typescript
coValueCore.getGroup(): Group
```
TODO: document

</details>



<details>
<summary><code>coValueCore.getTx(txID)</code>  (undocumented)</summary>

```typescript
coValueCore.getTx(
  txID: TransactionID
): undefined | Transaction
```
TODO: document

</details>



<details>
<summary><code>coValueCore.newContentSince(knownState)</code>  (undocumented)</summary>

```typescript
coValueCore.newContentSince(
  knownState: undefined | CoValueKnownState
): undefined | NewContentMessage
```
TODO: document

</details>



<details>
<summary><code>coValueCore.getDependedOnCoValues()</code>  (undocumented)</summary>

```typescript
coValueCore.getDependedOnCoValues(): TEMPLATE_LITERAL[]
```
TODO: document

</details>



----

## `CoValue` (interface in `cojson`)

```typescript
export interface CoValue {...}
```
TODO: document

### Properties

<details>
<summary><code>coValue.id</code>  </summary>

```typescript
coValue.id: CoID<CoValueImpl>
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>coValue.core</code>  (undocumented)</summary>

```typescript
coValue.core: CoValueCore
```
TODO: document

</details>



<details>
<summary><code>coValue.type</code>  </summary>

```typescript
coValue.type: "comap" | "colist" | "costream" | "static"
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>coValue.meta</code>  </summary>

```typescript
coValue.meta: null | JsonObject
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>coValue.group</code>  </summary>

```typescript
coValue.group: Group
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>



### Methods

<details>
<summary><code>coValue.toJSON()</code>  </summary>

```typescript
coValue.toJSON(): JsonValue
```
Returns an immutable JSON presentation of this `CoValue`



</details>



----

## `ReadableCoValue` (interface in `cojson`)

```typescript
export interface ReadableCoValue extends CoValue {...}
```
TODO: document

### Properties

<details>
<summary><code>readableCoValue.id</code> (from <code>CoValue</code>)  </summary>

```typescript
readableCoValue.id: CoID<CoValueImpl>
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>readableCoValue.core</code> (from <code>CoValue</code>)  (undocumented)</summary>

```typescript
readableCoValue.core: CoValueCore
```
TODO: document

</details>



<details>
<summary><code>readableCoValue.type</code> (from <code>CoValue</code>)  </summary>

```typescript
readableCoValue.type: "comap" | "colist" | "costream" | "static"
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>readableCoValue.meta</code> (from <code>CoValue</code>)  </summary>

```typescript
readableCoValue.meta: null | JsonObject
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>readableCoValue.group</code> (from <code>CoValue</code>)  </summary>

```typescript
readableCoValue.group: Group
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>



<details>
<summary><code>readableCoValue.edit</code>  (undocumented)</summary>

```typescript
readableCoValue.edit: (changer: (editable: WriteableCoValue) => void) => CoValueImpl
```
TODO: document

</details>



### Methods

<details>
<summary><code>readableCoValue.subscribe(listener)</code>  </summary>

```typescript
readableCoValue.subscribe(
  listener: (coValue: CoValueImpl) => void
): () => void
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>



<details>
<summary><code>readableCoValue.toJSON()</code> (from <code>CoValue</code>)  </summary>

```typescript
readableCoValue.toJSON(): JsonValue
```
Returns an immutable JSON presentation of this `CoValue`



</details>



----

## `Peer` (interface in `cojson`)

```typescript
export interface Peer {...}
```
TODO: document

### Properties

<details>
<summary><code>peer.id</code>  (undocumented)</summary>

```typescript
peer.id: string
```
TODO: document

</details>



<details>
<summary><code>peer.incoming</code>  (undocumented)</summary>

```typescript
peer.incoming: ReadableStream<SyncMessage>
```
TODO: document

</details>



<details>
<summary><code>peer.outgoing</code>  (undocumented)</summary>

```typescript
peer.outgoing: WritableStream<SyncMessage>
```
TODO: document

</details>



<details>
<summary><code>peer.role</code>  (undocumented)</summary>

```typescript
peer.role: "peer" | "server" | "client"
```
TODO: document

</details>



----

## `Value` (type alias in `cojson`)

```typescript
export type Value = JsonValue | CoValueImpl
```
TODO: document

TODO: doc generator not implemented yet

----

## `JsonValue` (type alias in `cojson`)

```typescript
export type JsonValue = JsonAtom | JsonArray | JsonObject | RawCoID
```
TODO: document

TODO: doc generator not implemented yet

----

## `CoValueImpl` (type alias in `cojson`)

```typescript
export type CoValueImpl = CoMap<{ [key: string]: JsonValue }, JsonObject | null> | CoList<JsonValue, JsonObject | null> | CoStream<JsonValue, JsonObject | null> | BinaryCoStream<BinaryCoStreamMeta> | Static<JsonObject>
```
TODO: document

TODO: doc generator not implemented yet

----

## `CoID` (type alias in `cojson`)

```typescript
export type CoID<T extends CoValueImpl> = RawCoID & {__type: T}
```
TODO: document

TODO: doc generator not implemented yet

----

## `AccountID` (type alias in `cojson`)

```typescript
export type AccountID = CoID<AccountMap>
```
TODO: document

TODO: doc generator not implemented yet

----

## `Profile` (type alias in `cojson`)

```typescript
export type Profile = CoMap<ProfileContent, ProfileMeta>
```
TODO: document

TODO: doc generator not implemented yet

----

## `SessionID` (type alias in `cojson`)

```typescript
export type SessionID = SessionID
```
TODO: document

TODO: doc generator not implemented yet

----

## `BinaryChunkInfo` (type alias in `cojson`)

```typescript
export type BinaryChunkInfo = {mimeType: string, fileName?: string, totalSizeBytes?: number}
```
TODO: document

TODO: doc generator not implemented yet

----

## `BinaryCoStreamMeta` (type alias in `cojson`)

```typescript
export type BinaryCoStreamMeta = JsonObject & {type: "binary"}
```
TODO: document

TODO: doc generator not implemented yet

----

## `AgentID` (type alias in `cojson`)

```typescript
export type AgentID = AgentID
```
TODO: document

TODO: doc generator not implemented yet

----

## `AgentSecret` (type alias in `cojson`)

```typescript
export type AgentSecret = AgentSecret
```
TODO: document

TODO: doc generator not implemented yet

----

## `InviteSecret` (type alias in `cojson`)

```typescript
export type InviteSecret = InviteSecret
```
TODO: document

TODO: doc generator not implemented yet

----

## `SyncMessage` (type alias in `cojson`)

```typescript
export type SyncMessage = LoadMessage | KnownStateMessage | NewContentMessage | DoneMessage
```
TODO: document

TODO: doc generator not implemented yet

----

## `cojsonReady` (variabl in `cojson`)

```typescript
export  cojsonReady
```
TODO: document

TODO: doc generator not implemented yet


# jazz-react

## `ReactAuthHook` (type alias in `jazz-react`)

```typescript
export type ReactAuthHook = () => {auth: AuthProvider, AuthUI: React.ReactNode, logOut?: () => void}
```
TODO: document

TODO: doc generator not implemented yet

----

## `<WithJazz/>` (function in `jazz-react`)

```typescript
export function WithJazz({children: ReactNode, auth: ReactAuthHook, syncAddress?: string}): Element
```
TODO: document

TODO: doc generator not implemented yet

----

## `useJazz()` (function in `jazz-react`)

```typescript
export function useJazz(): JazzContext
```
TODO: document

TODO: doc generator not implemented yet

----

## `useTelepathicState(id)` (function in `jazz-react`)

```typescript
export function useTelepathicState(id: CoID<T>): undefined | T
```
TODO: document

TODO: doc generator not implemented yet

----

## `useProfile(accountID)` (function in `jazz-react`)

```typescript
export function useProfile(accountID: AccountID): CoMap<P, CojsonInternalTypes.ProfileMeta> | undefined
```
TODO: document

TODO: doc generator not implemented yet

----

## `useBinaryStream(streamID, allowUnfinished)` (function in `jazz-react`)

```typescript
export function useBinaryStream(streamID: CoID<C>, allowUnfinished: boolean): {blob: Blob, blobURL: string} | undefined
```
TODO: document

TODO: doc generator not implemented yet

----

## `createBinaryStreamHandler(onCreated, inGroup, meta?)` (function in `jazz-react`)

```typescript
export function createBinaryStreamHandler(onCreated: (createdStream: C) => void, inGroup: Group, meta: C["meta"]): (event: ChangeEvent) => void
```
TODO: document

TODO: doc generator not implemented yet

----

## `createInviteLink(value, role, {baseURL?})` (function in `jazz-react`)

```typescript
export function createInviteLink(value: CoValueImpl, role: "reader" | "writer" | "admin", {baseURL?: string}): string
```
TODO: document

TODO: doc generator not implemented yet

----

## `parseInviteLink(inviteURL)` (function in `jazz-react`)

```typescript
export function parseInviteLink(inviteURL: string): {valueID: CoID<C>, inviteSecret: InviteSecret} | undefined
```
TODO: document

TODO: doc generator not implemented yet

----

## `consumeInviteLinkFromWindowLocation(node)` (function in `jazz-react`)

```typescript
export function consumeInviteLinkFromWindowLocation(node: LocalNode): Promise<{valueID: CoID<C>, inviteSecret: string} | undefined>
```
TODO: document

TODO: doc generator not implemented yet


# jazz-browser

## `AuthProvider` (interface in `jazz-browser`)

```typescript
export interface AuthProvider {...}
```
TODO: document

### Methods

<details>
<summary><code>authProvider.createNode(getSessionFor, initialPeers)</code>  (undocumented)</summary>

```typescript
authProvider.createNode(
  getSessionFor: SessionProvider,
  initialPeers: Peer[]
): Promise<LocalNode>
```
TODO: document

</details>



----

## `BrowserNodeHandle` (type alias in `jazz-browser`)

```typescript
export type BrowserNodeHandle = {node: LocalNode, done: () => void}
```
TODO: document

TODO: doc generator not implemented yet

----

## `SessionProvider` (type alias in `jazz-browser`)

```typescript
export type SessionProvider = (accountID: AccountID | AgentID) => Promise<SessionID>
```
TODO: document

TODO: doc generator not implemented yet

----

## `SessionHandle` (type alias in `jazz-browser`)

```typescript
export type SessionHandle = {session: Promise<SessionID>, done: () => void}
```
TODO: document

TODO: doc generator not implemented yet

----

## `createBrowserNode({auth, syncAddress?, reconnectionTimeout?})` (function in `jazz-browser`)

```typescript
export function createBrowserNode({auth: AuthProvider, syncAddress?: string, reconnectionTimeout?: number}): Promise<BrowserNodeHandle>
```
TODO: document

TODO: doc generator not implemented yet

----

## `createInviteLink(value, role, {baseURL?}?)` (function in `jazz-browser`)

```typescript
export function createInviteLink(value: CoValueImpl, role: "reader" | "writer" | "admin", {baseURL?: string}): string
```
TODO: document

TODO: doc generator not implemented yet

----

## `parseInviteLink(inviteURL)` (function in `jazz-browser`)

```typescript
export function parseInviteLink(inviteURL: string): {valueID: CoID<C>, inviteSecret: InviteSecret} | undefined
```
TODO: document

TODO: doc generator not implemented yet

----

## `consumeInviteLinkFromWindowLocation(node)` (function in `jazz-browser`)

```typescript
export function consumeInviteLinkFromWindowLocation(node: LocalNode): Promise<{valueID: CoID<C>, inviteSecret: string} | undefined>
```
TODO: document

TODO: doc generator not implemented yet

----

## `createBinaryStreamFromBlob(blob, inGroup, meta?)` (function in `jazz-browser`)

```typescript
export function createBinaryStreamFromBlob(blob: Blob | File, inGroup: Group, meta: C["meta"]): Promise<C>
```
TODO: document

TODO: doc generator not implemented yet

----

## `readBlobFromBinaryStream(streamId, node, allowUnfinished)` (function in `jazz-browser`)

```typescript
export function readBlobFromBinaryStream(streamId: CoID<C>, node: LocalNode, allowUnfinished: boolean): Promise<Blob | undefined>
```
TODO: document

TODO: doc generator not implemented yet