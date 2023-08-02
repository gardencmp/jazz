# CoJSON

CoJSON ("Collaborative JSON") will be a minimal protocol and implementation for collaborative values (CRDTs + public-key cryptography).

CoJSON is developed by [Garden Computing](https://gcmp.io) as the underpinnings of [Jazz](https://jazz.tools), a framework for building apps with telepathic data.

The protocol and implementation will cover:

- how to represent collaborative values internally
- the APIs collaborative values expose
- how to sync and query for collaborative values between peers
- how to enforce access rights within collaborative values locally and at sync boundaries

THIS IS WORK IN PROGRESS

## Core Value Types

### `Immutable` Values (JSON)
- null
- boolean
- number
- string
  - stringly-encoded CoJSON identifiers & data (`CoValueID`, `AgentID`, `SessionID`, `SignatoryID`, `SignatorySecret`, `Signature`, `RecipientID`, `RecipientSecret`, `Sealed`, `Hash`, `ShortHash`, `KeySecret`, `KeyID`, `Encrypted`, `Role`)

- array
- object

### `Collaborative` Values
- CoMap (`string` → `Immutable`, last-writer-wins per key)
  - Team (`AgentID` → `Role`)
- CoList (`Immutable[]`, addressable positions, insertAfter semantics)
  - Agent (`{signatoryID, recipientID}[]`)
- CoStream (independent per-session streams of `Immutable`s)
- Static (single addressable `Immutable`)

## Implementation Abstractions
- CoValue
  - Session Logs
  - Transactions
    - Private (encrypted) transactions
    - Trusting (unencrypted) transactions
  - Rulesets
- CoValue Content Types
- LocalNode
  - Peers
  - AgentCredentials
- Peer

## Extensions & higher-level protocols

### More complex datastructures
- CoText: a clean way to collaboratively mark up rich text with CoJSON
- CoJSON Tree: a clean way to represent collaborative tree structures with CoJSON