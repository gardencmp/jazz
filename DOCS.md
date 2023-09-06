# Namespaces

## CojsonInternalTypes

TODO: document

# Classes

## LocalNode

A `LocalNode` represents a local view of a set of loaded `CoValue`s, from the perspective of a particular account (or primitive cryptographic agent).

A `LocalNode` can have peers that it syncs to, for example some form of local persistence, or a sync server, such as `sync.jazz.tools` (Jazz Global Mesh).

### Example:

You typically get hold of a `LocalNode` using `jazz-react`'s `useJazz()`:

```typescript
const { localNode } = useJazz();
```

### Constructors

#### **`new LocalNode(account, currentSessionID)`**

```typescript
new LocalNode(account: GeneralizedControlledAccount, currentSessionID: SessionID): LocalNode
```
### Properties

### Methods

#### `LocalNode.`**`withNewlyCreatedAccount(name, initialAgentSecret)`**

```typescript
LocalNode.withNewlyCreatedAccount(name: string, initialAgentSecret: AgentSecret): {node: LocalNode, accountID: AccountID, accountSecret: AgentSecret, sessionID: SessionID}
```
#### `LocalNode.`**`withLoadedAccount(accountID, accountSecret, sessionID, peersToLoadFrom)`**

```typescript
LocalNode.withLoadedAccount(accountID: AccountID, accountSecret: AgentSecret, sessionID: SessionID, peersToLoadFrom: Peer[]): Promise<LocalNode>
```
#### **`load(id)`**

```typescript
localNode.load<T extends ContentType>(id: CoID<T>): Promise<T>
```
#### **`loadProfile(id)`**

```typescript
localNode.loadProfile(id: AccountID): Promise<Profile>
```
#### **`acceptInvite(groupOrOwnedValueID, inviteSecret)`**

```typescript
localNode.acceptInvite<T extends ContentType>(groupOrOwnedValueID: CoID<T>, inviteSecret: InviteSecret): Promise<void>
```
#### **`createGroup()`**

```typescript
localNode.createGroup(): Group
```
## Group

TODO: document

### Constructors

#### **`new Group(groupMap, node)`**

```typescript
new Group(groupMap: CoMap<GroupContent, null | JsonObject>, node: LocalNode): Group
```
### Properties

### Accessors

### Methods

#### **`roleOf(accountID)`**

```typescript
group.roleOf(accountID: AccountID): undefined | Role
```
#### **`myRole()`**

```typescript
group.myRole(): undefined | Role
```
#### **`addMember(accountID, role)`**

```typescript
group.addMember(accountID: AccountID, role: Role): void
```
#### **`createInvite(role)`**

```typescript
group.createInvite(role: "reader" | "writer" | "admin"): InviteSecret
```
#### **`rotateReadKey()`**

```typescript
group.rotateReadKey(): void
```
#### **`removeMember(accountID)`**

```typescript
group.removeMember(accountID: AccountID): void
```
#### **`createMap(meta)`**

```typescript
group.createMap<M extends CoMap<{ [key: string]: JsonValue }, null | JsonObject>>(meta: M["meta"]): M
```
#### **`createList(meta)`**

```typescript
group.createList<L extends CoList<JsonValue, null | JsonObject>>(meta: L["meta"]): L
```
## CoMap

TODO: document

### Constructors

#### **`new CoMap(coValue)`**

```typescript
new CoMap<M extends { [key: string]: JsonValue }, Meta extends null | JsonObject>(coValue: CoValue): CoMap<M, Meta>
```
### Properties

### Accessors

### Methods

#### **`fillOpsFromCoValue()`**

```typescript
coMap.fillOpsFromCoValue(): void
```
#### **`keys()`**

```typescript
coMap.keys(): MapK<M>[]
```
#### **`get(key)`**

```typescript
coMap.get<K extends string>(key: K): undefined | M[K]
```
#### **`getAtTime(key, time)`**

```typescript
coMap.getAtTime<K extends string>(key: K, time: number): undefined | M[K]
```
#### **`whoEdited(key)`**

```typescript
coMap.whoEdited<K extends string>(key: K): undefined | AccountID
```
#### **`getLastTxID(key)`**

```typescript
coMap.getLastTxID<K extends string>(key: K): undefined | TransactionID
```
#### **`getLastEntry(key)`**

```typescript
coMap.getLastEntry<K extends string>(key: K): undefined | {at: number, txID: TransactionID, value: M[K]}
```
#### **`getHistory(key)`**

```typescript
coMap.getHistory<K extends string>(key: K): {at: number, txID: TransactionID, value: undefined | M[K]}[]
```
#### **`toJSON()`**

```typescript
coMap.toJSON(): JsonObject
```
#### **`edit(changer)`**

```typescript
coMap.edit(changer: {undefined}): CoMap<M, Meta>
```
#### **`subscribe(listener)`**

```typescript
coMap.subscribe(listener: {undefined}): {undefined}
```
## CoList

TODO: document

### Constructors

#### **`new CoList(coValue)`**

```typescript
new CoList<T extends JsonValue, Meta extends null | JsonObject>(coValue: CoValue): CoList<T, Meta>
```
### Properties

### Accessors

### Methods

#### **`fillOpsFromCoValue()`**

```typescript
coList.fillOpsFromCoValue(): void
```
#### **`entries()`**

```typescript
coList.entries(): {value: T, madeAt: number, opID: OpID}[]
```
#### **`fillArrayFromOpID(opID, arr)`**

```typescript
coList.fillArrayFromOpID(opID: OpID, arr: {value: T, madeAt: number, opID: OpID}[]): void
```
#### **`whoInserted(idx)`**

```typescript
coList.whoInserted(idx: number): undefined | AccountID
```
#### **`toJSON()`**

```typescript
coList.toJSON(): T[]
```
#### **`asArray()`**

```typescript
coList.asArray(): T[]
```
#### **`map(mapper)`**

```typescript
coList.map<U>(mapper: {undefined}): U[]
```
#### **`filter(predicate)`**

```typescript
coList.filter<U extends JsonValue>(predicate: {undefined}): U[]
```
#### **`reduce(reducer, initialValue)`**

```typescript
coList.reduce<U>(reducer: {undefined}, initialValue: U): U
```
#### **`edit(changer)`**

```typescript
coList.edit(changer: {undefined}): CoList<T, Meta>
```
#### **`subscribe(listener)`**

```typescript
coList.subscribe(listener: {undefined}): {undefined}
```
## CoValue

TODO: document

### Constructors

#### **`new CoValue(header, node, internalInitSessions)`**

```typescript
new CoValue(header: CoValueHeader, node: LocalNode, internalInitSessions: { [key: SessionID]: SessionLog }): CoValue
```
### Properties

### Accessors

### Methods

#### **`testWithDifferentAccount(account, currentSessionID)`**

```typescript
coValue.testWithDifferentAccount(account: GeneralizedControlledAccount, currentSessionID: SessionID): CoValue
```
#### **`knownState()`**

```typescript
coValue.knownState(): CoValueKnownState
```
#### **`nextTransactionID()`**

```typescript
coValue.nextTransactionID(): TransactionID
```
#### **`tryAddTransactions(sessionID, newTransactions, givenExpectedNewHash, newSignature)`**

```typescript
coValue.tryAddTransactions(sessionID: SessionID, newTransactions: Transaction[], givenExpectedNewHash: undefined | TEMPLATE_LITERAL, newSignature: TEMPLATE_LITERAL): boolean
```
#### **`subscribe(listener)`**

```typescript
coValue.subscribe(listener: {undefined}): {undefined}
```
#### **`expectedNewHashAfter(sessionID, newTransactions)`**

```typescript
coValue.expectedNewHashAfter(sessionID: SessionID, newTransactions: Transaction[]): {expectedNewHash: TEMPLATE_LITERAL, newStreamingHash: StreamingHash}
```
#### **`makeTransaction(changes, privacy)`**

```typescript
coValue.makeTransaction(changes: JsonValue[], privacy: "private" | "trusting"): boolean
```
#### **`getCurrentContent()`**

```typescript
coValue.getCurrentContent(): ContentType
```
#### **`getValidSortedTransactions()`**

```typescript
coValue.getValidSortedTransactions(): DecryptedTransaction[]
```
#### **`getCurrentReadKey()`**

```typescript
coValue.getCurrentReadKey(): {secret: undefined | TEMPLATE_LITERAL, id: TEMPLATE_LITERAL}
```
#### **`getReadKey(keyID)`**

```typescript
coValue.getReadKey(keyID: TEMPLATE_LITERAL): undefined | TEMPLATE_LITERAL
```
#### **`getGroup()`**

```typescript
coValue.getGroup(): Group
```
#### **`getTx(txID)`**

```typescript
coValue.getTx(txID: TransactionID): undefined | Transaction
```
#### **`newContentSince(knownState)`**

```typescript
coValue.newContentSince(knownState: undefined | CoValueKnownState): undefined | NewContentMessage
```
#### **`getDependedOnCoValues()`**

```typescript
coValue.getDependedOnCoValues(): TEMPLATE_LITERAL[]
```
# Interfaces

## Peer

TODO: document

# Type Aliases

## Value

TODO: document

## JsonValue

TODO: document

## ContentType

TODO: document

## CoID

TODO: document

## AccountID

TODO: document

## Profile

TODO: document

## SessionID

TODO: document

## AgentID

TODO: document

## AgentSecret

TODO: document

## InviteSecret

TODO: document

## SyncMessage

TODO: document

