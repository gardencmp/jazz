# cojson

## `LocalNode` <sub><sup>(class in `cojson`)</sup></sub>

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

### Constructors in `LocalNode`

<details>
<summary><b><code>new LocalNode</code></b><code>(account, currentSessionID)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class LocalNode {

  constructor(
    account: GeneralizedControlledAccount,
    currentSessionID: SessionID
  ): LocalNode {...}

}
```
TODO: document

</details>

<br/>

### Methods in `LocalNode`

<details>
<summary>LocalNode.<b><code>withNewlyCreatedAccount</code></b><code>(name, initialAgentSecret?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class LocalNode {

  withNewlyCreatedAccount(
    name: string,
    initialAgentSecret?: AgentSecret = ...
  ): {
    node: LocalNode,
    accountID: AccountID,
    accountSecret: AgentSecret,
    sessionID: SessionID,
  } {...}

}
```
TODO: document

</details>



<details>
<summary>LocalNode.<b><code>withLoadedAccount</code></b><code>(accountID, accountSecret, sessionID, peersToLoadFrom)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class LocalNode {

  withLoadedAccount(
    accountID: AccountID,
    accountSecret: AgentSecret,
    sessionID: SessionID,
    peersToLoadFrom: Peer[]
  ): Promise<LocalNode> {...}

}
```
TODO: document

</details>







<details>
<summary>.<b><code>load</code></b><code>(id)</code>  </summary>

```typescript
class LocalNode {

  load<T extends CoValue>(
    id: CoID<T>
  ): Promise<T> {...}

}
```
Loads a CoValue's content, syncing from peers as necessary and resolving the returned
promise once a first version has been loaded. See `coValue.subscribe()` and `node.useTelepathicData()`
for listening to subsequent updates to the CoValue.



</details>



<details>
<summary>.<b><code>subscribe</code></b><code>(id, callback)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class LocalNode {

  subscribe<T extends CoValue>(
    id: CoID<T>,
    callback: (update: T) => void
  ): () => void {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>query</code></b><code>(id, callback)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class LocalNode {

  query<T extends CoValue>(
    id: CoID<T>,
    callback: (update: Queried<T> | undefined) => void
  ): () => void {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>loadProfile</code></b><code>(id)</code>  </summary>

```typescript
class LocalNode {

  loadProfile(
    id: AccountID
  ): Promise<Profile> {...}

}
```
Loads a profile associated with an account. `Profile` is at least a `CoMap<{string: name}>`,
but might contain other, app-specific properties.



</details>



<details>
<summary>.<b><code>acceptInvite</code></b><code>(groupOrOwnedValueID, inviteSecret)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class LocalNode {

  acceptInvite<T extends CoValue>(
    groupOrOwnedValueID: CoID<T>,
    inviteSecret: InviteSecret
  ): Promise<void> {...}

}
```
TODO: document

</details>











<details>
<summary>.<b><code>createGroup</code></b><code>()</code>  </summary>

```typescript
class LocalNode {

  createGroup(): Group {...}

}
```
Creates a new group (with the current account as the group's first admin).



</details>



<br/>

### Properties in `LocalNode`





<details>
<summary><code>.</code><b><code>currentSessionID</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class LocalNode {

  currentSessionID: SessionID

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>sync</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class LocalNode {

  sync: SyncManager

}
```
TODO: document

</details>



----

## `Group` <sub><sup>(class in `cojson`)</sup></sub>

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

### Accessors in `Group`

<details>
<summary><code>.</code><b><code>id</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class Group {

  get id(): CoID<CoMap<GroupContent, JsonObject | null>> {...}

}
```
TODO: document

</details>

<br/>

### Constructors in `Group`

<br/>

### Methods in `Group`

<details>
<summary>.<b><code>roleOf</code></b><code>(accountID)</code>  </summary>

```typescript
class Group {

  roleOf(
    accountID: AccountID
  ): Role | undefined {...}

}
```
Returns the current role of a given account.



</details>





<details>
<summary>.<b><code>myRole</code></b><code>()</code>  </summary>

```typescript
class Group {

  myRole(): Role | undefined {...}

}
```
Returns the role of the current account in the group.



</details>



<details>
<summary>.<b><code>addMember</code></b><code>(accountID, role)</code>  </summary>

```typescript
class Group {

  addMember(
    accountID: AccountID,
    role: Role
  ): void {...}

}
```
Directly grants a new member a role in the group. The current account must be an
admin to be able to do so. Throws otherwise.



</details>







<details>
<summary>.<b><code>removeMember</code></b><code>(accountID)</code>  </summary>

```typescript
class Group {

  removeMember(
    accountID: AccountID
  ): void {...}

}
```
Strips the specified member of all roles (preventing future writes in
 the group and owned values) and rotates the read encryption key for that group
(preventing reads of new content in the group and owned values)



</details>





<details>
<summary>.<b><code>createInvite</code></b><code>(role)</code>  </summary>

```typescript
class Group {

  createInvite(
    role: "admin" | "reader" | "writer"
  ): InviteSecret {...}

}
```
Creates an invite for new members to indirectly join the group, allowing them to grant themselves the specified role with the InviteSecret (a string starting with "inviteSecret_") - use `LocalNode.acceptInvite()` for this purpose.



</details>



<details>
<summary>.<b><code>createMap</code></b><code>(init?, meta?, initPrivacy?)</code>  </summary>

```typescript
class Group {

  createMap<M extends AnyCoMap>(
    init?: {
      [K in number | string | symbol]: M["_shape"][K] extends AnyCoValue ? any[any] | CoID<any[any]> : M["_shape"][K]
    },
    meta?: M["meta"],
    initPrivacy?: "private" | "trusting" = "trusting"
  ): M {...}

}
```
Creates a new `CoMap` within this group, with the specified specialized
 `CoMap` type `M` and optional static metadata.



</details>



<details>
<summary>.<b><code>createList</code></b><code>(init?, meta?, initPrivacy?)</code>  </summary>

```typescript
class Group {

  createList<L extends AnyCoList>(
    init?: L["_item"] extends CoValue ? any[any] | CoID<any[any]> : L["_item"][],
    meta?: L["meta"],
    initPrivacy?: "private" | "trusting" = "trusting"
  ): L {...}

}
```
Creates a new `CoList` within this group, with the specified specialized
`CoList` type `L` and optional static metadata.



</details>



<details>
<summary>.<b><code>createStream</code></b><code>(meta?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class Group {

  createStream<C extends CoStream<CoValue | JsonValue, JsonObject | null>>(
    meta?: C["meta"]
  ): C {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>createBinaryStream</code></b><code>(meta?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class Group {

  createBinaryStream<C extends BinaryCoStream<BinaryCoStreamMeta>>(
    meta?: C["meta"] = ...
  ): C {...}

}
```
TODO: document

</details>



<br/>

### Properties in `Group`

<details>
<summary><code>.</code><b><code>underlyingMap</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class Group {

  underlyingMap: CoMap<GroupContent, JsonObject | null>

}
```
TODO: document

</details>





----

## `CoMap` <sub><sup>(class in `cojson`)</sup></sub>

```typescript
export class CoMap<Shape extends {
  [key: string]: CoValue | JsonValue | undefined }, Meta extends JsonObject | null> extends CoMapView<Shape, Meta> implements CoValue {...}
```
A collaborative map with precise shape `M` and optional static metadata `Meta`



### Accessors in `CoMap`

<details>
<summary><code>.</code><b><code>meta</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class CoMap<Shape, Meta> {

  get meta(): Meta {...}

}
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>.</code><b><code>group</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class CoMap<Shape, Meta> {

  get group(): Group {...}

}
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>

<br/>

### Constructors in `CoMap`

<br/>

### Methods in `CoMap`

<details>
<summary>.<b><code>set</code></b><code>(key, value, privacy?)</code>  </summary>

```typescript
class CoMap<Shape, Meta> {

  set<K extends string>(
    key: K,
    value: Shape[K] extends CoValue ? any[any] | CoID<any[any]> : Shape[K],
    privacy?: "private" | "trusting"
  ): CoMap<Shape, Meta> {...}

}
```
Returns a new version of this CoMap with a new value for the given key.

If `privacy` is `"private"` **(default)**, both `key` and `value` are encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, both `key` and `value` are stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary>.<b><code>set</code></b><code>(kv, privacy?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoMap<Shape, Meta> {

  set(
    kv: {
      [K in string]: Shape[K] extends CoValue ? any[any] | CoID<any[any]> : Shape[K]
    },
    privacy?: "private" | "trusting"
  ): CoMap<Shape, Meta> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>delete</code></b><code>(key, privacy?)</code>  </summary>

```typescript
class CoMap<Shape, Meta> {

  delete(
    key: keyof Shape & string,
    privacy?: "private" | "trusting" = "private"
  ): CoMap<Shape, Meta> {...}

}
```
Returns a new version of this CoMap with the given key deleted (setting it to undefined).

If `privacy` is `"private"` **(default)**, `key` is encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, `key` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary>.<b><code>mutate</code></b><code>(mutator)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoMap<Shape, Meta> {

  mutate(
    mutator: (mutable: MutableCoMap<Shape, Meta>) => void
  ): CoMap<Shape, Meta> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>edit</code></b><code>(mutator)</code>  </summary>

```typescript
class CoMap<Shape, Meta> {

  edit(
    mutator: (mutable: MutableCoMap<Shape, Meta>) => void
  ): CoMap<Shape, Meta> {...}

}
```




</details>



<details>
<summary>.<b><code>atTime</code></b><code>(time)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoMap<Shape, Meta> {

  atTime(
    time: number
  ): CoMap<Shape, Meta> {...}

}
```
TODO: document

</details>





<details>
<summary>.<b><code>keys</code></b><code>()</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoMap<Shape, Meta> {

  keys(): keyof Shape & string[] {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>get</code></b><code>(key)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class CoMap<Shape, Meta> {

  get<K extends string>(
    key: K
  ): Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue> | undefined {...}

}
```
Returns the current value for the given key.



</details>



<details>
<summary>.<b><code>asObject</code></b><code>()</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoMap<Shape, Meta> {

  asObject(): {
    [K in string]: Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue>
  } {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>toJSON</code></b><code>()</code> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class CoMap<Shape, Meta> {

  toJSON(): {
    [K in string]: Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue>
  } {...}

}
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary>.<b><code>nthEditAt</code></b><code>(key, n)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoMap<Shape, Meta> {

  nthEditAt<K extends string>(
    key: K,
    n: number
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value?: Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>lastEditAt</code></b><code>(key)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoMap<Shape, Meta> {

  lastEditAt<K extends string>(
    key: K
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value?: Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>editsAt</code></b><code>(key)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoMap<Shape, Meta> {

  editsAt<K extends string>(
    key: K
  ): Generator<{
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value?: Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue>,
  }, void, unknown> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>subscribe</code></b><code>(listener)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class CoMap<Shape, Meta> {

  subscribe(
    listener: (coMap: CoMap<Shape, Meta>) => void
  ): () => void {...}

}
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>

<br/>

### Properties in `CoMap`

<details>
<summary><code>.</code><b><code>id</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class CoMap<Shape, Meta> {

  id: CoID<CoMap<Shape, Meta>>

}
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>.</code><b><code>type</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class CoMap<Shape, Meta> {

  type: "comap"

}
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>.</code><b><code>core</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoMap<Shape, Meta> {

  core: CoValueCore

}
```
TODO: document

</details>





<details>
<summary><code>.</code><b><code>_shape</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoMap<Shape, Meta> {

  _shape: Shape

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>atTimeFilter</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoMap<Shape, Meta> {

  atTimeFilter: number

}
```
TODO: document

</details>



----

## `MutableCoMap` <sub><sup>(class in `cojson`)</sup></sub>

```typescript
export class MutableCoMap<Shape extends {
  [key: string]: CoValue | JsonValue | undefined }, Meta extends JsonObject | null> extends CoMapView<Shape, Meta> implements CoValue {...}
```
TODO: document

### Accessors in `MutableCoMap`

<details>
<summary><code>.</code><b><code>meta</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class MutableCoMap<Shape, Meta> {

  get meta(): Meta {...}

}
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>.</code><b><code>group</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class MutableCoMap<Shape, Meta> {

  get group(): Group {...}

}
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>

<br/>

### Constructors in `MutableCoMap`

<br/>

### Methods in `MutableCoMap`

<details>
<summary>.<b><code>set</code></b><code>(key, value, privacy?)</code>  </summary>

```typescript
class MutableCoMap<Shape, Meta> {

  set<K extends string>(
    key: K,
    value: Shape[K] extends CoValue ? any[any] | CoID<any[any]> : Shape[K],
    privacy?: "private" | "trusting" = "private"
  ): void {...}

}
```
Sets a new value for the given key.

If `privacy` is `"private"` **(default)**, both `key` and `value` are encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, both `key` and `value` are stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary>.<b><code>delete</code></b><code>(key, privacy?)</code>  </summary>

```typescript
class MutableCoMap<Shape, Meta> {

  delete(
    key: keyof Shape & string,
    privacy?: "private" | "trusting" = "private"
  ): void {...}

}
```
Deletes the value for the given key (setting it to undefined).

If `privacy` is `"private"` **(default)**, `key` is encrypted in the transaction, only readable by other members of the group this `CoMap` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, `key` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary>.<b><code>atTime</code></b><code>(time)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoMap<Shape, Meta> {

  atTime(
    time: number
  ): MutableCoMap<Shape, Meta> {...}

}
```
TODO: document

</details>





<details>
<summary>.<b><code>keys</code></b><code>()</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoMap<Shape, Meta> {

  keys(): keyof Shape & string[] {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>get</code></b><code>(key)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class MutableCoMap<Shape, Meta> {

  get<K extends string>(
    key: K
  ): Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue> | undefined {...}

}
```
Returns the current value for the given key.



</details>



<details>
<summary>.<b><code>asObject</code></b><code>()</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoMap<Shape, Meta> {

  asObject(): {
    [K in string]: Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue>
  } {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>toJSON</code></b><code>()</code> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class MutableCoMap<Shape, Meta> {

  toJSON(): {
    [K in string]: Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue>
  } {...}

}
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary>.<b><code>nthEditAt</code></b><code>(key, n)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoMap<Shape, Meta> {

  nthEditAt<K extends string>(
    key: K,
    n: number
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value?: Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>lastEditAt</code></b><code>(key)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoMap<Shape, Meta> {

  lastEditAt<K extends string>(
    key: K
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value?: Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>editsAt</code></b><code>(key)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoMap<Shape, Meta> {

  editsAt<K extends string>(
    key: K
  ): Generator<{
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value?: Shape[K] extends CoValue ? CoID<any[any]> : Exclude<Shape[K], CoValue>,
  }, void, unknown> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>subscribe</code></b><code>(listener)</code> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class MutableCoMap<Shape, Meta> {

  subscribe(
    listener: (coMap: MutableCoMap<Shape, Meta>) => void
  ): () => void {...}

}
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>

<br/>

### Properties in `MutableCoMap`

<details>
<summary><code>.</code><b><code>id</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class MutableCoMap<Shape, Meta> {

  id: CoID<MutableCoMap<Shape, Meta>>

}
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>.</code><b><code>type</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  </summary>

```typescript
class MutableCoMap<Shape, Meta> {

  type: "comap"

}
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>.</code><b><code>core</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoMap<Shape, Meta> {

  core: CoValueCore

}
```
TODO: document

</details>





<details>
<summary><code>.</code><b><code>_shape</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoMap<Shape, Meta> {

  _shape: Shape

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>atTimeFilter</code></b> <sub><sup>from <code>CoMapView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoMap<Shape, Meta> {

  atTimeFilter: number

}
```
TODO: document

</details>



----

## `CoList` <sub><sup>(class in `cojson`)</sup></sub>

```typescript
export class CoList<Item extends CoValue | JsonValue, Meta extends JsonObject | null> extends CoListView<Item, Meta> implements CoValue {...}
```
TODO: document

### Accessors in `CoList`

<details>
<summary><code>.</code><b><code>meta</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class CoList<Item, Meta> {

  get meta(): Meta {...}

}
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>.</code><b><code>group</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class CoList<Item, Meta> {

  get group(): Group {...}

}
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>

<br/>

### Constructors in `CoList`

<br/>

### Methods in `CoList`

<details>
<summary>.<b><code>append</code></b><code>(item, after?, privacy?)</code>  </summary>

```typescript
class CoList<Item, Meta> {

  append(
    item: Item extends CoValue ? CoID<Item> | Item : Item,
    after?: number,
    privacy?: "private" | "trusting" = "private"
  ): CoList<Item, Meta> {...}

}
```
Returns a new version of this CoList with `item` appended after the item currently at index `after`.

If `privacy` is `"private"` **(default)**, `item` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, `item` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary>.<b><code>prepend</code></b><code>(item, before?, privacy?)</code>  </summary>

```typescript
class CoList<Item, Meta> {

  prepend(
    item: Item extends CoValue ? CoID<Item> | Item : Item,
    before?: number,
    privacy?: "private" | "trusting" = "private"
  ): CoList<Item, Meta> {...}

}
```
Returns a new version of this CoList with `item` prepended before the item currently at index `before`.

If `privacy` is `"private"` **(default)**, `item` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, `item` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary>.<b><code>delete</code></b><code>(at, privacy?)</code>  </summary>

```typescript
class CoList<Item, Meta> {

  delete(
    at: number,
    privacy?: "private" | "trusting" = "private"
  ): CoList<Item, Meta> {...}

}
```
Returns a new version of this CoList with the item at index `at` deleted from the list.

If `privacy` is `"private"` **(default)**, the fact of this deletion is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, the fact of this deletion is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary>.<b><code>mutate</code></b><code>(mutator)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoList<Item, Meta> {

  mutate(
    mutator: (mutable: MutableCoList<Item, Meta>) => void
  ): CoList<Item, Meta> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>edit</code></b><code>(mutator)</code>  </summary>

```typescript
class CoList<Item, Meta> {

  edit(
    mutator: (mutable: MutableCoList<Item, Meta>) => void
  ): CoList<Item, Meta> {...}

}
```




</details>



<details>
<summary>.<b><code>atTime</code></b><code>(_time)</code> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class CoList<Item, Meta> {

  atTime(
    _time: number
  ): CoList<Item, Meta> {...}

}
```
Not yet implemented



</details>



<details>
<summary>.<b><code>get</code></b><code>(idx)</code> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class CoList<Item, Meta> {

  get(
    idx: number
  ): Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue> | undefined {...}

}
```
Get the item currently at `idx`.



</details>



<details>
<summary>.<b><code>asArray</code></b><code>()</code> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class CoList<Item, Meta> {

  asArray(): Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>[] {...}

}
```
Returns the current items in the CoList as an array.



</details>



<details>
<summary>.<b><code>entries</code></b><code>()</code> <sub><sup>from <code>CoListView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoList<Item, Meta> {

  entries(): {
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
    madeAt: number,
    opID: OpID,
  }[] {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>toJSON</code></b><code>()</code> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class CoList<Item, Meta> {

  toJSON(): Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>[] {...}

}
```
Returns the current items in the CoList as an array. (alias of `asArray`)



</details>



<details>
<summary>.<b><code>editAt</code></b><code>(idx)</code> <sub><sup>from <code>CoListView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoList<Item, Meta> {

  editAt(
    idx: number
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>deletionEdits</code></b><code>()</code> <sub><sup>from <code>CoListView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoList<Item, Meta> {

  deletionEdits(): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
  }[] {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>subscribe</code></b><code>(listener)</code> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class CoList<Item, Meta> {

  subscribe(
    listener: (coList: CoList<Item, Meta>) => void
  ): () => void {...}

}
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>

<br/>

### Properties in `CoList`

<details>
<summary><code>.</code><b><code>id</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class CoList<Item, Meta> {

  id: CoID<CoList<Item, Meta>>

}
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>.</code><b><code>type</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class CoList<Item, Meta> {

  type: "colist"

}
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>.</code><b><code>core</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoList<Item, Meta> {

  core: CoValueCore

}
```
TODO: document

</details>











<details>
<summary><code>.</code><b><code>_item</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoList<Item, Meta> {

  _item: Item

}
```
TODO: document

</details>



----

## `MutableCoList` <sub><sup>(class in `cojson`)</sup></sub>

```typescript
export class MutableCoList<Item extends CoValue | JsonValue, Meta extends JsonObject | null> extends CoListView<Item, Meta> implements CoValue {...}
```
TODO: document

### Accessors in `MutableCoList`

<details>
<summary><code>.</code><b><code>meta</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  get meta(): Meta {...}

}
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>.</code><b><code>group</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  get group(): Group {...}

}
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>

<br/>

### Constructors in `MutableCoList`

<br/>

### Methods in `MutableCoList`

<details>
<summary>.<b><code>append</code></b><code>(item, after?, privacy?)</code>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  append(
    item: Item extends CoValue ? CoID<Item> | Item : Item,
    after?: number,
    privacy?: "private" | "trusting" = "private"
  ): void {...}

}
```
Appends `item` after the item currently at index `after`.

If `privacy` is `"private"` **(default)**, `item` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, `item` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary>.<b><code>prepend</code></b><code>(item, before?, privacy?)</code>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  prepend(
    item: Item extends CoValue ? CoID<Item> | Item : Item,
    before?: number,
    privacy?: "private" | "trusting" = "private"
  ): void {...}

}
```
Prepends `item` before the item currently at index `before`.

If `privacy` is `"private"` **(default)**, `item` is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, `item` is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary>.<b><code>delete</code></b><code>(at, privacy?)</code>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  delete(
    at: number,
    privacy?: "private" | "trusting" = "private"
  ): void {...}

}
```
Deletes the item at index `at` from the list.

If `privacy` is `"private"` **(default)**, the fact of this deletion is encrypted in the transaction, only readable by other members of the group this `CoList` belongs to. Not even sync servers can see the content in plaintext.

If `privacy` is `"trusting"`, the fact of this deletion is stored in plaintext in the transaction, visible to everyone who gets a hold of it, including sync servers.



</details>



<details>
<summary>.<b><code>atTime</code></b><code>(_time)</code> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  atTime(
    _time: number
  ): MutableCoList<Item, Meta> {...}

}
```
Not yet implemented



</details>



<details>
<summary>.<b><code>get</code></b><code>(idx)</code> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  get(
    idx: number
  ): Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue> | undefined {...}

}
```
Get the item currently at `idx`.



</details>



<details>
<summary>.<b><code>asArray</code></b><code>()</code> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  asArray(): Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>[] {...}

}
```
Returns the current items in the CoList as an array.



</details>



<details>
<summary>.<b><code>entries</code></b><code>()</code> <sub><sup>from <code>CoListView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoList<Item, Meta> {

  entries(): {
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
    madeAt: number,
    opID: OpID,
  }[] {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>toJSON</code></b><code>()</code> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  toJSON(): Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>[] {...}

}
```
Returns the current items in the CoList as an array. (alias of `asArray`)



</details>



<details>
<summary>.<b><code>editAt</code></b><code>(idx)</code> <sub><sup>from <code>CoListView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoList<Item, Meta> {

  editAt(
    idx: number
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>deletionEdits</code></b><code>()</code> <sub><sup>from <code>CoListView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoList<Item, Meta> {

  deletionEdits(): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
  }[] {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>subscribe</code></b><code>(listener)</code> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  subscribe(
    listener: (coList: MutableCoList<Item, Meta>) => void
  ): () => void {...}

}
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>

<br/>

### Properties in `MutableCoList`

<details>
<summary><code>.</code><b><code>id</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  id: CoID<MutableCoList<Item, Meta>>

}
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>.</code><b><code>type</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  </summary>

```typescript
class MutableCoList<Item, Meta> {

  type: "colist"

}
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>.</code><b><code>core</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoList<Item, Meta> {

  core: CoValueCore

}
```
TODO: document

</details>











<details>
<summary><code>.</code><b><code>_item</code></b> <sub><sup>from <code>CoListView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoList<Item, Meta> {

  _item: Item

}
```
TODO: document

</details>



----

## `CoStream` <sub><sup>(class in `cojson`)</sup></sub>

```typescript
export class CoStream<Item extends CoValue | JsonValue, Meta extends JsonObject | null> extends CoStreamView<Item, Meta> implements CoValue {...}
```
TODO: document

### Accessors in `CoStream`

<details>
<summary><code>.</code><b><code>meta</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class CoStream<Item, Meta> {

  get meta(): Meta {...}

}
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>.</code><b><code>group</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class CoStream<Item, Meta> {

  get group(): Group {...}

}
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>

<br/>

### Constructors in `CoStream`

<details>
<summary><b><code>new CoStream</code></b><code>(core)</code> <sub><sup>from <code>CoStreamView<Item, Meta></code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  constructor<Item extends CoValue | JsonValue, Meta extends JsonObject | null>(
    core: CoValueCore
  ): CoStream<Item, Meta> {...}

}
```
TODO: document

</details>

<br/>

### Methods in `CoStream`

<details>
<summary>.<b><code>push</code></b><code>(item, privacy?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  push(
    item: Item extends CoValue ? CoID<Item> | Item : Item,
    privacy?: "private" | "trusting" = "private"
  ): CoStream<Item, Meta> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>mutate</code></b><code>(mutator)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  mutate(
    mutator: (mutable: MutableCoStream<Item, Meta>) => void
  ): CoStream<Item, Meta> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>edit</code></b><code>(mutator)</code>  </summary>

```typescript
class CoStream<Item, Meta> {

  edit(
    mutator: (mutable: MutableCoStream<Item, Meta>) => void
  ): CoStream<Item, Meta> {...}

}
```




</details>



<details>
<summary>.<b><code>atTime</code></b><code>(_time)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class CoStream<Item, Meta> {

  atTime(
    _time: number
  ): CoStream<Item, Meta> {...}

}
```
Not yet implemented



</details>





<details>
<summary>.<b><code>getSingleStream</code></b><code>()</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  getSingleStream(): Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>[] | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>sessions</code></b><code>()</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  sessions(): SessionID[] {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>accounts</code></b><code>()</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  accounts(): Set<AccountID | AgentID> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>nthItemIn</code></b><code>(sessionID, n)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  nthItemIn(
    sessionID: SessionID,
    n: number
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>lastItemIn</code></b><code>(sessionID)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  lastItemIn(
    sessionID: SessionID
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>itemsIn</code></b><code>(sessionID)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  itemsIn(
    sessionID: SessionID
  ): Generator<{
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
  }, void, unknown> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>lastItemBy</code></b><code>(account)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  lastItemBy(
    account: AccountID | AgentID
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>itemsBy</code></b><code>(account)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  itemsBy(
    account: AccountID | AgentID
  ): Generator<{
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
    in: SessionID,
  }, void, unknown> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>toJSON</code></b><code>()</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class CoStream<Item, Meta> {

  toJSON(): {
    [key: SessionID]: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>[] } {...}

}
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary>.<b><code>subscribe</code></b><code>(listener)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class CoStream<Item, Meta> {

  subscribe(
    listener: (coStream: CoStream<Item, Meta>) => void
  ): () => void {...}

}
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>

<br/>

### Properties in `CoStream`

<details>
<summary><code>.</code><b><code>id</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class CoStream<Item, Meta> {

  id: CoID<CoStream<Item, Meta>>

}
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>.</code><b><code>type</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class CoStream<Item, Meta> {

  type: "costream"

}
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>.</code><b><code>core</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  core: CoValueCore

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>items</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  items: {
    [key: SessionID]: CoStreamItem<Item>[] }

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>_item</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoStream<Item, Meta> {

  _item: Item

}
```
TODO: document

</details>



----

## `MutableCoStream` <sub><sup>(class in `cojson`)</sup></sub>

```typescript
export class MutableCoStream<Item extends CoValue | JsonValue, Meta extends JsonObject | null> extends CoStreamView<Item, Meta> implements CoValue {...}
```
TODO: document

### Accessors in `MutableCoStream`

<details>
<summary><code>.</code><b><code>meta</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class MutableCoStream<Item, Meta> {

  get meta(): Meta {...}

}
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>.</code><b><code>group</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class MutableCoStream<Item, Meta> {

  get group(): Group {...}

}
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>

<br/>

### Constructors in `MutableCoStream`

<details>
<summary><b><code>new MutableCoStream</code></b><code>(core)</code> <sub><sup>from <code>CoStreamView<Item, Meta></code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  constructor<Item extends CoValue | JsonValue, Meta extends JsonObject | null>(
    core: CoValueCore
  ): MutableCoStream<Item, Meta> {...}

}
```
TODO: document

</details>

<br/>

### Methods in `MutableCoStream`

<details>
<summary>.<b><code>push</code></b><code>(item, privacy?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  push(
    item: Item extends CoValue ? CoID<Item> | Item : Item,
    privacy?: "private" | "trusting" = "private"
  ): void {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>atTime</code></b><code>(_time)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class MutableCoStream<Item, Meta> {

  atTime(
    _time: number
  ): MutableCoStream<Item, Meta> {...}

}
```
Not yet implemented



</details>





<details>
<summary>.<b><code>getSingleStream</code></b><code>()</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  getSingleStream(): Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>[] | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>sessions</code></b><code>()</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  sessions(): SessionID[] {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>accounts</code></b><code>()</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  accounts(): Set<AccountID | AgentID> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>nthItemIn</code></b><code>(sessionID, n)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  nthItemIn(
    sessionID: SessionID,
    n: number
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>lastItemIn</code></b><code>(sessionID)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  lastItemIn(
    sessionID: SessionID
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>itemsIn</code></b><code>(sessionID)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  itemsIn(
    sessionID: SessionID
  ): Generator<{
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
  }, void, unknown> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>lastItemBy</code></b><code>(account)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  lastItemBy(
    account: AccountID | AgentID
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>itemsBy</code></b><code>(account)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  itemsBy(
    account: AccountID | AgentID
  ): Generator<{
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>,
    in: SessionID,
  }, void, unknown> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>toJSON</code></b><code>()</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class MutableCoStream<Item, Meta> {

  toJSON(): {
    [key: SessionID]: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>[] } {...}

}
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary>.<b><code>subscribe</code></b><code>(listener)</code> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class MutableCoStream<Item, Meta> {

  subscribe(
    listener: (coStream: MutableCoStream<Item, Meta>) => void
  ): () => void {...}

}
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>

<br/>

### Properties in `MutableCoStream`

<details>
<summary><code>.</code><b><code>id</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class MutableCoStream<Item, Meta> {

  id: CoID<MutableCoStream<Item, Meta>>

}
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>.</code><b><code>type</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  </summary>

```typescript
class MutableCoStream<Item, Meta> {

  type: "costream"

}
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>.</code><b><code>core</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  core: CoValueCore

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>items</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  items: {
    [key: SessionID]: CoStreamItem<Item>[] }

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>_item</code></b> <sub><sup>from <code>CoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableCoStream<Item, Meta> {

  _item: Item

}
```
TODO: document

</details>



----

## `BinaryCoStream` <sub><sup>(class in `cojson`)</sup></sub>

```typescript
export class BinaryCoStream<Meta extends BinaryCoStreamMeta> extends BinaryCoStreamView<Meta> implements CoValue {...}
```
TODO: document

### Accessors in `BinaryCoStream`

<details>
<summary><code>.</code><b><code>meta</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class BinaryCoStream<Meta> {

  get meta(): Meta {...}

}
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>.</code><b><code>group</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class BinaryCoStream<Meta> {

  get group(): Group {...}

}
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>

<br/>

### Constructors in `BinaryCoStream`

<details>
<summary><b><code>new BinaryCoStream</code></b><code>(core)</code> <sub><sup>from <code>BinaryCoStreamView<Meta></code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  constructor<Meta extends BinaryCoStreamMeta>(
    core: CoValueCore
  ): BinaryCoStream<Meta> {...}

}
```
TODO: document

</details>

<br/>

### Methods in `BinaryCoStream`



<details>
<summary>.<b><code>startBinaryStream</code></b><code>(settings, privacy?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  startBinaryStream(
    settings: BinaryStreamInfo,
    privacy?: "private" | "trusting" = "private"
  ): BinaryCoStream<Meta> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>pushBinaryStreamChunk</code></b><code>(chunk, privacy?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  pushBinaryStreamChunk(
    chunk: Uint8Array,
    privacy?: "private" | "trusting" = "private"
  ): BinaryCoStream<Meta> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>endBinaryStream</code></b><code>(privacy?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  endBinaryStream(
    privacy?: "private" | "trusting" = "private"
  ): BinaryCoStream<Meta> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>mutate</code></b><code>(mutator)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  mutate(
    mutator: (mutable: MutableBinaryCoStream<Meta>) => void
  ): BinaryCoStream<Meta> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>edit</code></b><code>(mutator)</code>  </summary>

```typescript
class BinaryCoStream<Meta> {

  edit(
    mutator: (mutable: MutableBinaryCoStream<Meta>) => void
  ): BinaryCoStream<Meta> {...}

}
```




</details>



<details>
<summary>.<b><code>getBinaryChunks</code></b><code>(allowUnfinished?)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  getBinaryChunks(
    allowUnfinished?: boolean
  ): (BinaryStreamInfo & {
    chunks: Uint8Array[],
    finished: boolean,
  }) | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>atTime</code></b><code>(_time)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class BinaryCoStream<Meta> {

  atTime(
    _time: number
  ): BinaryCoStream<Meta> {...}

}
```
Not yet implemented



</details>





<details>
<summary>.<b><code>getSingleStream</code></b><code>()</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  getSingleStream(): BinaryStreamItem[] | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>sessions</code></b><code>()</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  sessions(): SessionID[] {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>accounts</code></b><code>()</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  accounts(): Set<AccountID | AgentID> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>nthItemIn</code></b><code>(sessionID, n)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  nthItemIn(
    sessionID: SessionID,
    n: number
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: BinaryStreamItem,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>lastItemIn</code></b><code>(sessionID)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  lastItemIn(
    sessionID: SessionID
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: BinaryStreamItem,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>itemsIn</code></b><code>(sessionID)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  itemsIn(
    sessionID: SessionID
  ): Generator<{
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: BinaryStreamItem,
  }, void, unknown> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>lastItemBy</code></b><code>(account)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  lastItemBy(
    account: AccountID | AgentID
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: BinaryStreamItem,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>itemsBy</code></b><code>(account)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  itemsBy(
    account: AccountID | AgentID
  ): Generator<{
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: BinaryStreamItem,
    in: SessionID,
  }, void, unknown> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>toJSON</code></b><code>()</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class BinaryCoStream<Meta> {

  toJSON(): {
    [key: SessionID]: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>[] } {...}

}
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary>.<b><code>subscribe</code></b><code>(listener)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class BinaryCoStream<Meta> {

  subscribe(
    listener: (coStream: BinaryCoStream<Meta>) => void
  ): () => void {...}

}
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>

<br/>

### Properties in `BinaryCoStream`

<details>
<summary><code>.</code><b><code>id</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class BinaryCoStream<Meta> {

  id: CoID<BinaryCoStream<Meta>>

}
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>.</code><b><code>type</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class BinaryCoStream<Meta> {

  type: "costream"

}
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>.</code><b><code>core</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  core: CoValueCore

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>items</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  items: {
    [key: SessionID]: CoStreamItem<Item>[] }

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>_item</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class BinaryCoStream<Meta> {

  _item: BinaryStreamItem

}
```
TODO: document

</details>



----

## `MutableBinaryCoStream` <sub><sup>(class in `cojson`)</sup></sub>

```typescript
export class MutableBinaryCoStream<Meta extends BinaryCoStreamMeta> extends BinaryCoStreamView<Meta> implements CoValue {...}
```
TODO: document

### Accessors in `MutableBinaryCoStream`

<details>
<summary><code>.</code><b><code>meta</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class MutableBinaryCoStream<Meta> {

  get meta(): Meta {...}

}
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>.</code><b><code>group</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class MutableBinaryCoStream<Meta> {

  get group(): Group {...}

}
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>

<br/>

### Constructors in `MutableBinaryCoStream`

<details>
<summary><b><code>new MutableBinaryCoStream</code></b><code>(core)</code> <sub><sup>from <code>BinaryCoStreamView<Meta></code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  constructor<Meta extends BinaryCoStreamMeta>(
    core: CoValueCore
  ): MutableBinaryCoStream<Meta> {...}

}
```
TODO: document

</details>

<br/>

### Methods in `MutableBinaryCoStream`



<details>
<summary>.<b><code>startBinaryStream</code></b><code>(settings, privacy?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  startBinaryStream(
    settings: BinaryStreamInfo,
    privacy?: "private" | "trusting" = "private"
  ): void {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>pushBinaryStreamChunk</code></b><code>(chunk, privacy?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  pushBinaryStreamChunk(
    chunk: Uint8Array,
    privacy?: "private" | "trusting" = "private"
  ): void {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>endBinaryStream</code></b><code>(privacy?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  endBinaryStream(
    privacy?: "private" | "trusting" = "private"
  ): void {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>getBinaryChunks</code></b><code>(allowUnfinished?)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  getBinaryChunks(
    allowUnfinished?: boolean
  ): (BinaryStreamInfo & {
    chunks: Uint8Array[],
    finished: boolean,
  }) | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>atTime</code></b><code>(_time)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class MutableBinaryCoStream<Meta> {

  atTime(
    _time: number
  ): MutableBinaryCoStream<Meta> {...}

}
```
Not yet implemented



</details>





<details>
<summary>.<b><code>getSingleStream</code></b><code>()</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  getSingleStream(): BinaryStreamItem[] | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>sessions</code></b><code>()</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  sessions(): SessionID[] {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>accounts</code></b><code>()</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  accounts(): Set<AccountID | AgentID> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>nthItemIn</code></b><code>(sessionID, n)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  nthItemIn(
    sessionID: SessionID,
    n: number
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: BinaryStreamItem,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>lastItemIn</code></b><code>(sessionID)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  lastItemIn(
    sessionID: SessionID
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: BinaryStreamItem,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>itemsIn</code></b><code>(sessionID)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  itemsIn(
    sessionID: SessionID
  ): Generator<{
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: BinaryStreamItem,
  }, void, unknown> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>lastItemBy</code></b><code>(account)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  lastItemBy(
    account: AccountID | AgentID
  ): {
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: BinaryStreamItem,
  } | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>itemsBy</code></b><code>(account)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  itemsBy(
    account: AccountID | AgentID
  ): Generator<{
    by: AccountID | AgentID,
    tx: TransactionID,
    at: Date,
    value: BinaryStreamItem,
    in: SessionID,
  }, void, unknown> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>toJSON</code></b><code>()</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class MutableBinaryCoStream<Meta> {

  toJSON(): {
    [key: SessionID]: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>[] } {...}

}
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary>.<b><code>subscribe</code></b><code>(listener)</code> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class MutableBinaryCoStream<Meta> {

  subscribe(
    listener: (coStream: MutableBinaryCoStream<Meta>) => void
  ): () => void {...}

}
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>

<br/>

### Properties in `MutableBinaryCoStream`

<details>
<summary><code>.</code><b><code>id</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class MutableBinaryCoStream<Meta> {

  id: CoID<MutableBinaryCoStream<Meta>>

}
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>.</code><b><code>type</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  </summary>

```typescript
class MutableBinaryCoStream<Meta> {

  type: "costream"

}
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>.</code><b><code>core</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  core: CoValueCore

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>items</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  items: {
    [key: SessionID]: CoStreamItem<Item>[] }

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>_item</code></b> <sub><sup>from <code>BinaryCoStreamView</code></sup></sub>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class MutableBinaryCoStream<Meta> {

  _item: BinaryStreamItem

}
```
TODO: document

</details>



----

## `CoValueCore` <sub><sup>(class in `cojson`)</sup></sub>

```typescript
export class CoValueCore {...}
```
TODO: document

### Accessors in `CoValueCore`

<details>
<summary><code>.</code><b><code>sessions</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  get sessions(): Readonly<{
    [key: SessionID]: SessionLog }> {...}

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>meta</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  get meta(): JsonValue {...}

}
```
TODO: document

</details>

<br/>

### Constructors in `CoValueCore`

<details>
<summary><b><code>new CoValueCore</code></b><code>(header, node, internalInitSessions?)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  constructor(
    header: CoValueHeader,
    node: LocalNode,
    internalInitSessions?: {
      [key: SessionID]: SessionLog } = {}
  ): CoValueCore {...}

}
```
TODO: document

</details>

<br/>

### Methods in `CoValueCore`

<details>
<summary>.<b><code>testWithDifferentAccount</code></b><code>(account, currentSessionID)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  testWithDifferentAccount(
    account: GeneralizedControlledAccount,
    currentSessionID: SessionID
  ): CoValueCore {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>knownState</code></b><code>()</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  knownState(): CoValueKnownState {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>nextTransactionID</code></b><code>()</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  nextTransactionID(): TransactionID {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>tryAddTransactions</code></b><code>(sessionID, newTransactions, givenExpectedNewHash, newSignature)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  tryAddTransactions(
    sessionID: SessionID,
    newTransactions: Transaction[],
    givenExpectedNewHash: `hash_z${string}` | undefined,
    newSignature: `signature_z${string}`
  ): boolean {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>tryAddTransactionsAsync</code></b><code>(sessionID, newTransactions, givenExpectedNewHash, newSignature)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  tryAddTransactionsAsync(
    sessionID: SessionID,
    newTransactions: Transaction[],
    givenExpectedNewHash: `hash_z${string}` | undefined,
    newSignature: `signature_z${string}`
  ): Promise<boolean> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>doAddTransactions</code></b><code>(sessionID, newTransactions, newSignature, expectedNewHash, newStreamingHash)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  doAddTransactions(
    sessionID: SessionID,
    newTransactions: Transaction[],
    newSignature: `signature_z${string}`,
    expectedNewHash: `hash_z${string}`,
    newStreamingHash: StreamingHash
  ): void {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>subscribe</code></b><code>(listener)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  subscribe(
    listener: (content: CoValue) => void
  ): () => void {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>expectedNewHashAfter</code></b><code>(sessionID, newTransactions)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  expectedNewHashAfter(
    sessionID: SessionID,
    newTransactions: Transaction[]
  ): {
    expectedNewHash: `hash_z${string}`,
    newStreamingHash: StreamingHash,
  } {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>expectedNewHashAfterAsync</code></b><code>(sessionID, newTransactions)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  expectedNewHashAfterAsync(
    sessionID: SessionID,
    newTransactions: Transaction[]
  ): Promise<{
    expectedNewHash: `hash_z${string}`,
    newStreamingHash: StreamingHash,
  }> {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>makeTransaction</code></b><code>(changes, privacy)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  makeTransaction(
    changes: JsonValue[],
    privacy: "private" | "trusting"
  ): boolean {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>getCurrentContent</code></b><code>()</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  getCurrentContent(): CoValue {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>getValidSortedTransactions</code></b><code>()</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  getValidSortedTransactions(): DecryptedTransaction[] {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>getCurrentReadKey</code></b><code>()</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  getCurrentReadKey(): {
    secret: `keySecret_z${string}` | undefined,
    id: `key_z${string}`,
  } {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>getReadKey</code></b><code>(keyID)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  getReadKey(
    keyID: `key_z${string}`
  ): `keySecret_z${string}` | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>getGroup</code></b><code>()</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  getGroup(): Group {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>getTx</code></b><code>(txID)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  getTx(
    txID: TransactionID
  ): Transaction | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>newContentSince</code></b><code>(knownState)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  newContentSince(
    knownState: CoValueKnownState | undefined
  ): NewContentMessage[] | undefined {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>getDependedOnCoValues</code></b><code>()</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  getDependedOnCoValues(): `co_z${string}`[] {...}

}
```
TODO: document

</details>

<br/>

### Properties in `CoValueCore`

<details>
<summary><code>.</code><b><code>id</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  id: `co_z${string}`

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>node</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  node: LocalNode

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>header</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  header: CoValueHeader

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>_sessions</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  _sessions: {
    [key: SessionID]: SessionLog }

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>listeners</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  listeners: Set<(content: CoValue) => void>

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>_decryptionCache</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  _decryptionCache: {
    [key: Encrypted<JsonValue[], JsonValue>]: Stringified<JsonValue[]> | undefined }

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>_cachedContent</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
class CoValueCore {

  _cachedContent: CoValue

}
```
TODO: document

</details>



----



----

## `Media` <sub><sup>(namespace in `cojson`)</sup></sub>

```typescript
export namespace Media {...}
```
TODO: document

### Type Aliases in `Media`

<details>
<summary><code>Media.</code><b><code>ImageDefinition</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
namespace Media {

  ImageDefinition: CoMap<{  originalSize: [number, number],
    placeholderDataURL?: string,
    [res: `${number}x${number}`]: BinaryCoStream }>

}
```
TODO: document

</details>



----

## `CoValue` <sub><sup>(interface in `cojson`)</sup></sub>

```typescript
export interface CoValue {...}
```
TODO: document

### Methods in `CoValue`

<details>
<summary>.<b><code>toJSON</code></b><code>()</code>  </summary>

```typescript
interface CoValue {

  toJSON(): JsonValue {...}

}
```
Returns an immutable JSON presentation of this `CoValue`



</details>



<details>
<summary>.<b><code>atTime</code></b><code>(time)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
interface CoValue {

  atTime(
    time: number
  ): CoValue {...}

}
```
TODO: document

</details>



<details>
<summary>.<b><code>subscribe</code></b><code>(listener)</code>  </summary>

```typescript
interface CoValue {

  subscribe(
    listener: (coValue: CoValue) => void
  ): () => void {...}

}
```
Lets you subscribe to future updates to this CoValue (whether made locally or by other users).

Takes a listener function that will be called with the current state for each update.

Returns an unsubscribe function.

Used internally by `useTelepathicData()` for reactive updates on changes to a `CoValue`.



</details>

<br/>

### Properties in `CoValue`

<details>
<summary><code>.</code><b><code>id</code></b>  </summary>

```typescript
interface CoValue {

  id: CoID<CoValue>

}
```
The `CoValue`'s (precisely typed) `CoID`



</details>



<details>
<summary><code>.</code><b><code>core</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
interface CoValue {

  core: CoValueCore

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>type</code></b>  </summary>

```typescript
interface CoValue {

  type: string

}
```
Specifies which kind of `CoValue` this is



</details>



<details>
<summary><code>.</code><b><code>meta</code></b>  </summary>

```typescript
interface CoValue {

  meta: JsonObject | null

}
```
The `CoValue`'s (precisely typed) static metadata



</details>



<details>
<summary><code>.</code><b><code>group</code></b>  </summary>

```typescript
interface CoValue {

  group: Group

}
```
The `Group` this `CoValue` belongs to (determining permissions)



</details>



----

## `Peer` <sub><sup>(interface in `cojson`)</sup></sub>

```typescript
export interface Peer {...}
```
TODO: document

### Properties in `Peer`

<details>
<summary><code>.</code><b><code>id</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
interface Peer {

  id: string

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>incoming</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
interface Peer {

  incoming: ReadableStream<SyncMessage>

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>outgoing</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
interface Peer {

  outgoing: WritableStream<SyncMessage>

}
```
TODO: document

</details>



<details>
<summary><code>.</code><b><code>role</code></b>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
interface Peer {

  role: "client" | "peer" | "server"

}
```
TODO: document

</details>



----

## `Value` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type Value = AnyCoValue | JsonValue
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `JsonValue` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type JsonValue = JsonArray | JsonAtom | JsonObject | RawCoID
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `AnyCoValue` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type AnyCoValue = AnyBinaryCoStream | AnyCoList | AnyCoMap | AnyCoStream
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `CoID` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type CoID<T extends CoValue> = RawCoID & {
  __type: T,
}
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `Queried` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type Queried<T extends CoValue> = T extends AnyCoMap
  ? QueriedCoMap<T>
  : T extends AnyCoList
    ? QueriedCoList<T>
    : T extends AnyCoStream
      ? T["meta"] extends {
        type: "binary",
      } ? never : QueriedCoStream<T>
      : never
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `QueriedCoMap` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type QueriedCoMap<M extends AnyCoMap> = {
  [K in keyof M["_shape"] & string]: ValueOrSubQueried<M["_shape"][K]>
} & {
  co: {
    id: CoID<M>,
    type: "comap",
    edits: {
      [K in keyof M["_shape"] & string]: {
        tx: TransactionID,
        at: Date,
        value: M["_shape"][K] extends CoValue ? CoID<M["_shape"][K]> : Exclude<M["_shape"][K], CoValue>,
        all: {
          tx: TransactionID,
          at: Date,
          by?: QueriedAccountAndProfile,
          value?: M["_shape"][K] extends CoValue ? CoID<M["_shape"][K]> : Exclude<M["_shape"][K], CoValue>,
        }[],
        by?: QueriedAccountAndProfile,
      } | undefined
    },
    meta: M["meta"],
    group: Group,
    core: CoValueCore,
    set(
      key: K,
      value: M["_shape"][K] extends CoValue ? any[any] | CoID<any[any]> : M["_shape"][K],
      privacy: "private" | "trusting"
    ): M
    set(
      kv: {
        [K in string]: M["_shape"][K] extends CoValue ? any[any] | CoID<any[any]> : M["_shape"][K]
      },
      privacy: "private" | "trusting"
    ): M,
    delete(
      key: keyof M["_shape"] & string,
      privacy: "private" | "trusting"
    ): M,
    mutate(
      mutator: (mutable: MutableCoMap<M["_shape"], M["meta"]>) => void
    ): M,
  },
}
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `QueriedCoList` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type QueriedCoList<L extends AnyCoList> = readonly ValueOrSubQueried<L["_item"]>[] & {
  co: {
    id: CoID<L>,
    type: "colist",
    meta: L["meta"],
    group: Group,
    core: CoValueCore,
    append(
      item: L["_item"] extends CoValue ? any[any] | CoID<any[any]> : L["_item"],
      after: number,
      privacy: "private" | "trusting"
    ): L,
    prepend(
      item: L["_item"] extends CoValue ? any[any] | CoID<any[any]> : L["_item"],
      before: number,
      privacy: "private" | "trusting"
    ): L,
    delete(
      at: number,
      privacy: "private" | "trusting"
    ): L,
    mutate(
      mutator: (mutable: MutableCoList<L["_item"], L["meta"]>) => void
    ): L,
    edits: {
      tx: TransactionID,
      at: Date,
      value: L["_item"] extends CoValue ? CoID<L["_item"]> : Exclude<L["_item"], CoValue>,
      by?: QueriedAccountAndProfile,
    }[],
    deletions: {
      tx: TransactionID,
      at: Date,
      by?: QueriedAccountAndProfile,
    }[],
  },
}
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `QueriedCoStream` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type QueriedCoStream<S extends AnyCoStream> = {
  perAccount: {
    [account: AccountID]: QueriedCoStreamItems<S["_item"]> },
  perSession: {
    [session: SessionID]: QueriedCoStreamItems<S["_item"]> },
  co: {
    id: CoID<S>,
    type: "costream",
    meta: S["meta"],
    group: Group,
    core: CoValueCore,
    push(
      item: S["_item"] extends CoValue ? any[any] | CoID<any[any]> : S["_item"],
      privacy: "private" | "trusting"
    ): S,
    mutate(
      mutator: (mutable: MutableCoStream<S["_item"], S["meta"]>) => void
    ): S,
  },
  me?: QueriedCoStreamItems<S["_item"]>,
}
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `AccountID` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type AccountID = CoID<Account>
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `Account` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type Account = CoMap<AccountContent, AccountMeta>
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `Profile` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type Profile = CoMap<ProfileContent, ProfileMeta>
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `SessionID` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type SessionID = SessionID
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `BinaryStreamInfo` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type BinaryStreamInfo = {
  mimeType: string,
  fileName?: string,
  totalSizeBytes?: number,
}
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `BinaryCoStreamMeta` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type BinaryCoStreamMeta = JsonObject & {
  type: "binary",
}
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `AgentID` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type AgentID = AgentID
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `AgentSecret` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type AgentSecret = AgentSecret
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `InviteSecret` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type InviteSecret = InviteSecret
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `SyncMessage` <sub><sup>(type alias in `cojson`)</sup></sub>

```typescript
export type SyncMessage = DoneMessage | KnownStateMessage | LoadMessage | NewContentMessage
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `cojsonReady` <sub><sup>(variable in `cojson`)</sup></sub>

```typescript
export  cojsonReady
```
TODO: document

TODO: doc generator not implemented yet 32

----

## `MAX_RECOMMENDED_TX_SIZE` <sub><sup>(variable in `cojson`)</sup></sub>

```typescript
export  MAX_RECOMMENDED_TX_SIZE
```
TODO: document

TODO: doc generator not implemented yet 32


# jazz-react

## `<WithJazz/>` <sub><sup>(function in `jazz-react`)</sup></sub>

```typescript
export function WithJazz({
  children: ReactNode,
  auth: ReactAuthHook,
  syncAddress?: string,
}): Element
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `useJazz()` <sub><sup>(function in `jazz-react`)</sup></sub>

```typescript
export function useJazz(): JazzContext
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `useTelepathicState(id?)` <sub><sup>(function in `jazz-react`)</sup></sub>

```typescript
export function useTelepathicState(id: CoID<T>): T | undefined
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `useTelepathicQuery(id?)` <sub><sup>(function in `jazz-react`)</sup></sub>

```typescript
export function useTelepathicQuery(id: CoID<T>): Queried<T> | undefined
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `useProfile(accountID?)` <sub><sup>(function in `jazz-react`)</sup></sub>

```typescript
export function useProfile(accountID: AccountID): CoMap<P, CojsonInternalTypes.ProfileMeta> | undefined
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `useBinaryStream(streamID?, allowUnfinished?)` <sub><sup>(function in `jazz-react`)</sup></sub>

```typescript
export function useBinaryStream(streamID: CoID<C>, allowUnfinished: boolean): {
  blob: Blob,
  blobURL: string,
} | undefined
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `createInviteLink(value, role, {baseURL?}?)` <sub><sup>(function in `jazz-react`)</sup></sub>

```typescript
export function createInviteLink(value: Queried<T> | T, role: "admin" | "reader" | "writer", {
  baseURL?: string,
}): string
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `parseInviteLink(inviteURL)` <sub><sup>(function in `jazz-react`)</sup></sub>

```typescript
export function parseInviteLink(inviteURL: string): {
  valueID: CoID<C>,
  inviteSecret: InviteSecret,
} | undefined
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `consumeInviteLinkFromWindowLocation(node)` <sub><sup>(function in `jazz-react`)</sup></sub>

```typescript
export function consumeInviteLinkFromWindowLocation(node: LocalNode): Promise<{
  valueID: CoID<C>,
  inviteSecret: string,
} | undefined>
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `ReactAuthHook` <sub><sup>(type alias in `jazz-react`)</sup></sub>

```typescript
export type ReactAuthHook = () => {
  auth: AuthProvider,
  AuthUI: React.ReactNode,
  logOut?: () => void,
}
```
TODO: document

TODO: doc generator not implemented yet 2097152


# jazz-browser

## `createBrowserNode({auth, syncAddress?, reconnectionTimeout?})` <sub><sup>(function in `jazz-browser`)</sup></sub>

```typescript
export function createBrowserNode({
  auth: AuthProvider,
  syncAddress?: string,
  reconnectionTimeout?: number,
}): Promise<BrowserNodeHandle>
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `createInviteLink(value, role, {baseURL?}?)` <sub><sup>(function in `jazz-browser`)</sup></sub>

```typescript
export function createInviteLink(value: Queried<T> | T, role: "admin" | "reader" | "writer", {
  baseURL?: string,
}): string
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `parseInviteLink(inviteURL)` <sub><sup>(function in `jazz-browser`)</sup></sub>

```typescript
export function parseInviteLink(inviteURL: string): {
  valueID: CoID<C>,
  inviteSecret: InviteSecret,
} | undefined
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `consumeInviteLinkFromWindowLocation(node)` <sub><sup>(function in `jazz-browser`)</sup></sub>

```typescript
export function consumeInviteLinkFromWindowLocation(node: LocalNode): Promise<{
  valueID: CoID<C>,
  inviteSecret: string,
} | undefined>
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `createBinaryStreamFromBlob(blob, inGroup, meta?)` <sub><sup>(function in `jazz-browser`)</sup></sub>

```typescript
export function createBinaryStreamFromBlob(blob: Blob | File, inGroup: Group, meta: C["meta"]): Promise<C>
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `readBlobFromBinaryStream(streamId, node, allowUnfinished?)` <sub><sup>(function in `jazz-browser`)</sup></sub>

```typescript
export function readBlobFromBinaryStream(streamId: CoID<C>, node: LocalNode, allowUnfinished: boolean): Promise<Blob | undefined>
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `AuthProvider` <sub><sup>(interface in `jazz-browser`)</sup></sub>

```typescript
export interface AuthProvider {...}
```
TODO: document

### Methods in `AuthProvider`

<details>
<summary>.<b><code>createNode</code></b><code>(getSessionFor, initialPeers)</code>  <sub><sup>(undocumented)</sup></sub></summary>

```typescript
interface AuthProvider {

  createNode(
    getSessionFor: SessionProvider,
    initialPeers: Peer[]
  ): Promise<LocalNode> {...}

}
```
TODO: document

</details>



----

## `BrowserNodeHandle` <sub><sup>(type alias in `jazz-browser`)</sup></sub>

```typescript
export type BrowserNodeHandle = {
  node: LocalNode,
  done: () => void,
}
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `SessionProvider` <sub><sup>(type alias in `jazz-browser`)</sup></sub>

```typescript
export type SessionProvider = (accountID: AccountID | AgentID) => Promise<SessionID>
```
TODO: document

TODO: doc generator not implemented yet 2097152

----

## `SessionHandle` <sub><sup>(type alias in `jazz-browser`)</sup></sub>

```typescript
export type SessionHandle = {
  session: Promise<SessionID>,
  done: () => void,
}
```
TODO: document

TODO: doc generator not implemented yet 2097152


# jazz-browser-media-images

## `createImage(image, inGroup)` <sub><sup>(function in `jazz-browser-media-images`)</sup></sub>

```typescript
export function createImage(image: Blob | File, inGroup: Group): Promise<Media.ImageDefinition>
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `loadImage(image, localNode, progressiveCallback)` <sub><sup>(function in `jazz-browser-media-images`)</sup></sub>

```typescript
export function loadImage(image: {
  id: CoID<ImageDefinition>,
} | CoID<ImageDefinition> | ImageDefinition, localNode: LocalNode, progressiveCallback: (update: LoadingImageInfo) => void): () => void
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `LoadingImageInfo` <sub><sup>(type alias in `jazz-browser-media-images`)</sup></sub>

```typescript
export type LoadingImageInfo = {
  originalSize?: [number, number],
  placeholderDataURL?: string,
  highestResSrc?: string,
}
```
TODO: document

TODO: doc generator not implemented yet 2097152


# jazz-react-media-images

## `useLoadImage(imageID?)` <sub><sup>(function in `jazz-react-media-images`)</sup></sub>

```typescript
export function useLoadImage(imageID: {
  id: CoID<ImageDefinition>,
} | CoID<ImageDefinition> | ImageDefinition): LoadingImageInfo | undefined
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `createImage(image, inGroup)` <sub><sup>(function in `jazz-react-media-images`)</sup></sub>

```typescript
export function createImage(image: Blob | File, inGroup: Group): Promise<Media.ImageDefinition>
```
TODO: document

TODO: doc generator not implemented yet 64

----

## `LoadingImageInfo` <sub><sup>(type alias in `jazz-react-media-images`)</sup></sub>

```typescript
export type LoadingImageInfo = {
  originalSize?: [number, number],
  placeholderDataURL?: string,
  highestResSrc?: string,
}
```
TODO: document

TODO: doc generator not implemented yet 2097152