# Jazz - instant sync

Jazz is an open-source toolkit for *permissioned telepathic data.*

- Ship faster & simplify your frontend, backend & devops
- Get cross-device sync, real-time multiplayer & offline support for free

## What is Permissioned Telepathic Data?

**Telepathic** means:

- Read and write data from anywhere in your app, as if it was local
- Always have that data synced, instantly
  - to other devices of the same user, or to other users, collaborating
  - to your backend, workers, etc. *(coming soon)*

**Permissioned** means:

- Fine-grained, role-based permissions are *baked into* your data
- They are enforced everywhere, locally (using cryptography instead of by a backend)
- Roles can be changed dynamically, supporting changing teams, invite links and more

Note: because it is quite a mouthful, we will refer to just *telepathic data* below, but we always mean *permissioned telepathic data*.

### Why should you care?

If you build your app with telepathic data you only have to do three things:

1. Define your data model
2. Define your permission model
3. Connect a user interface to telepathic data implementing 1. and 2.

Things you **don't have to worry about anymore** are: building an API, handling local and backend state, handling user sessions, local persistence, offline support, multiplayer, most editing conflicts, cloud storage & backend persistence (if you use Jazz Global Mesh)

##