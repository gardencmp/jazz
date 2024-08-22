# jazz-autosub

## 0.7.34

### Patch Changes

-   Updated dependencies [5d91f9f]
-   Updated dependencies [5094e6d]
-   Updated dependencies [b09589b]
-   Updated dependencies [2c3a40c]
-   Updated dependencies [4e16575]
-   Updated dependencies [ea882ab]
    -   cojson@0.7.34

## 0.7.34-neverthrow.8

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.34-neverthrow.8

## 0.7.34-neverthrow.7

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.34-neverthrow.7

## 0.7.34-neverthrow.4

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.34-neverthrow.4

## 0.7.34-neverthrow.3

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.34-neverthrow.3

## 0.7.34-neverthrow.1

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.34-neverthrow.1

## 0.7.34-neverthrow.0

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.34-neverthrow.0

## 0.7.33

### Patch Changes

-   Updated dependencies [b297c93]
-   Updated dependencies [3bf5127]
-   Updated dependencies [a8b74ff]
-   Updated dependencies [db53161]
    -   cojson@0.7.33

## 0.7.33-hotfixes.5

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.33-hotfixes.5

## 0.7.33-hotfixes.4

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.33-hotfixes.4

## 0.7.33-hotfixes.3

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.33-hotfixes.3

## 0.7.33-hotfixes.0

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.33-hotfixes.0

## 0.7.32

### Patch Changes

-   Adapt type of applyDiff to make CoMaps fully subclassable again

## 0.7.31

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.31

## 0.7.29

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.29

## 0.7.28

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.28

## 0.7.26

### Patch Changes

-   Remove Effect from jazz/cojson internals
-   Updated dependencies
    -   cojson@0.7.26

## 0.7.25

### Patch Changes

-   Implement applyDiff on CoMap to only update changed fields

## 0.7.24

### Patch Changes

-   Remove effectful API for loading/subscribing

## 0.7.23

### Patch Changes

-   Mostly complete OPFS implementation (single-tab only)
-   Updated dependencies
    -   cojson@0.7.23

## 0.7.21

### Patch Changes

-   Fix another bug in CoMap 'has' proxy trap

## 0.7.20

### Patch Changes

-   Fix bug in CoMap 'has' trap

## 0.7.19

### Patch Changes

-   Add support for "in" operator in CoMaps

## 0.7.18

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.18

## 0.7.17

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.17

## 0.7.16

### Patch Changes

-   Fix: allow null in encoded fields

## 0.7.14

### Patch Changes

-   Use Effect Queues and Streams instead of custom queue implementation
-   Updated dependencies
    -   cojson@0.7.14

## 0.7.13

### Patch Changes

-   Fix CoList.toJSON()

## 0.7.12

### Patch Changes

-   Fix: toJSON infinitely recurses on circular CoValue structures

## 0.7.11

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.11
    -   cojson-transport-nodejs-ws@0.7.11

## 0.7.10

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.10
    -   cojson-transport-nodejs-ws@0.7.10

## 0.7.9

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.9
    -   cojson-transport-nodejs-ws@0.7.9

## 0.7.8

### Patch Changes

-   Fix CoMaps not initialising properly when passing too many init options

## 0.7.6

### Patch Changes

-   Provide way to create accounts as another account

## 0.7.3

### Patch Changes

-   Clean up loading & subscription API

## 0.7.1

### Patch Changes

-   Add runtime option for optional refs

## 0.7.0

### Minor Changes

-   e299c3e: New simplified API

### Patch Changes

-   8636319: Fix infinite recursion in subscriptionScope
-   8636319: Fix type of init param for CoMap.create
-   1a35307: Implement first devtools formatters
-   96c494f: Implement profile visibility based on groups & new migration signature
-   59c18c3: CoMap fix
-   19f52b7: Fixed bug with newRandomSessionID being called before crypto was ready
-   8636319: Implement deep loading, simplify API
-   19004b4: Add .all to CoStreamEntry
-   a78f168: Make Account -> Profile a lazy ref schema
-   52675c9: Fix CoList.splice / RawCoList.append
-   129e2c1: More precise imports from @effect/schema
-   1cfa279: More superclass-compatible CoMaps
-   704af7d: Add maxWidth option for loading images
-   460478f: Use effect 3.0
-   6b0418f: Fix image resolution loading
-   ed5643a: Fix CoMap \_refs for co.items
-   bde684f: CoValue casting & auto-subbing \_owner
-   c4151fc: Support stricter TS lint rules
-   63374cc: Relax types of CoMap.\_schema
-   01ac646: Make CoMaps even more subclassable
-   a5e68a4: Make refs type more precise
-   952982e: Consistent proxy based API
-   1a35307: Add ability to declare minimum required data in subscribe & Improve property access tracing
-   5fa277c: Fix CoMap.Record.toJSON()
-   60d5ca2: Introduce jazz-tools CLI
-   21771c4: Reintroduce changes from main
-   77c2b56: Get rid of self generics, new create syntax
-   63374cc: Fix schema of Account & Group
-   d2e03ff: Fix variance of ID.\_\_type
-   354bdcd: Even friendlier for subclassing CoMap
-   60d5ca2: Clean up exports
-   69ac514: Use effect schema much less
-   f8a5c46: Fix CoStream types
-   f0f6f1b: Clean up API more & re-add jazz-nodejs
-   e5eed5b: Make refs on list more precise
-   1a44f87: Refactoring
-   627d895: Get rid of Co namespace
-   1200aae: Cache CoValue proxies
-   63374cc: Make sure delete on CoMaps deletes keys
-   ece35b3: Make fast-check a direct dependency to help dev time resolution
-   38d4410: CoMap fixes and improvements
-   85d2b62: More subclass-friendly types in CoMap
-   fd86c11: Extract jazz cli into jazz-run package
-   52675c9: Fix Costream[...].all
-   Updated dependencies [1a35307]
-   Updated dependencies [96c494f]
-   Updated dependencies [19f52b7]
-   Updated dependencies [d8fe2b1]
-   Updated dependencies [1200aae]
-   Updated dependencies [52675c9]
-   Updated dependencies [1a35307]
-   Updated dependencies [e299c3e]
-   Updated dependencies [bf0f8ec]
-   Updated dependencies [c4151fc]
-   Updated dependencies [8636319]
-   Updated dependencies [952982e]
-   Updated dependencies [21771c4]
-   Updated dependencies [69ac514]
-   Updated dependencies [f0f6f1b]
-   Updated dependencies [1a44f87]
-   Updated dependencies [627d895]
-   Updated dependencies [63374cc]
-   Updated dependencies [a423eee]
    -   cojson@0.7.0
    -   cojson-transport-nodejs-ws@0.7.0

## 0.7.0-alpha.42

### Patch Changes

-   Fixed bug with newRandomSessionID being called before crypto was ready
-   Updated dependencies
    -   cojson@0.7.0-alpha.42
    -   cojson-transport-nodejs-ws@0.7.0-alpha.42

## 0.7.0-alpha.41

### Patch Changes

-   Updated dependencies
    -   cojson-transport-nodejs-ws@0.7.0-alpha.41

## 0.7.0-alpha.39

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.0-alpha.39
    -   cojson-transport-nodejs-ws@0.7.0-alpha.39

## 0.7.0-alpha.38

### Patch Changes

-   Fix infinite recursion in subscriptionScope
-   Fix type of init param for CoMap.create
-   Implement deep loading, simplify API
-   Updated dependencies
    -   cojson@0.7.0-alpha.38
    -   cojson-transport-nodejs-ws@0.7.0-alpha.38

## 0.7.0-alpha.37

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.0-alpha.37
    -   cojson-transport-nodejs-ws@0.7.0-alpha.37

## 0.7.0-alpha.36

### Patch Changes

-   1a35307: Implement first devtools formatters
-   6b0418f: Fix image resolution loading
-   1a35307: Add ability to declare minimum required data in subscribe & Improve property access tracing
-   Updated dependencies [1a35307]
-   Updated dependencies [1a35307]
    -   cojson@0.7.0-alpha.36
    -   cojson-transport-nodejs-ws@0.7.0-alpha.36

## 0.7.0-alpha.35

### Patch Changes

-   Cache CoValue proxies
-   Updated dependencies
    -   cojson@0.7.0-alpha.35
    -   cojson-transport-nodejs-ws@0.7.0-alpha.35

## 0.7.0-alpha.34

### Patch Changes

-   Extract jazz cli into jazz-run package

## 0.7.0-alpha.32

### Patch Changes

-   Introduce jazz-tools CLI
-   Clean up exports

## 0.7.0-alpha.31

### Patch Changes

-   Get rid of self generics, new create syntax

## 0.7.0-alpha.30

### Patch Changes

-   CoValue casting & auto-subbing \_owner

## 0.7.0-alpha.29

### Patch Changes

-   Reintroduce changes from main
-   Updated dependencies
    -   cojson@0.7.0-alpha.29

## 0.7.0-alpha.28

### Patch Changes

-   Implement profile visibility based on groups & new migration signature
-   Updated dependencies
    -   cojson@0.7.0-alpha.28

## 0.7.0-alpha.27

### Patch Changes

-   Fix CoList.splice / RawCoList.append
-   Fix Costream[...].all
-   Updated dependencies
    -   cojson@0.7.0-alpha.27

## 0.7.0-alpha.26

### Patch Changes

-   Fix CoMap.Record.toJSON()

## 0.7.0-alpha.25

### Patch Changes

-   Make Account -> Profile a lazy ref schema

## 0.7.0-alpha.24

### Patch Changes

-   Relax types of CoMap.\_schema
-   Fix schema of Account & Group
-   Make sure delete on CoMaps deletes keys
-   Updated dependencies
    -   cojson@0.7.0-alpha.24

## 0.7.0-alpha.23

### Patch Changes

-   CoMap fixes and improvements

## 0.7.0-alpha.22

### Patch Changes

-   Fix CoMap \_refs for co.items

## 0.7.0-alpha.21

### Patch Changes

-   Add maxWidth option for loading images

## 0.7.0-alpha.20

### Patch Changes

-   Make fast-check a direct dependency to help dev time resolution

## 0.7.0-alpha.19

### Patch Changes

-   More precise imports from @effect/schema

## 0.7.0-alpha.17

### Patch Changes

-   Use effect 3.0

## 0.7.0-alpha.16

### Patch Changes

-   Make CoMaps even more subclassable

## 0.7.0-alpha.15

### Patch Changes

-   More superclass-compatible CoMaps

## 0.7.0-alpha.14

### Patch Changes

-   Fix CoStream types

## 0.7.0-alpha.13

### Patch Changes

-   Add .all to CoStreamEntry

## 0.7.0-alpha.12

### Patch Changes

-   Fix variance of ID.\_\_type

## 0.7.0-alpha.11

### Patch Changes

-   Support stricter TS lint rules
-   Updated dependencies
    -   cojson@0.7.0-alpha.11

## 0.7.0-alpha.10

### Patch Changes

-   Clean up API more & re-add jazz-nodejs
-   Updated dependencies
    -   cojson@0.7.0-alpha.10

## 0.7.0-alpha.9

### Patch Changes

-   Even friendlier for subclassing CoMap

## 0.7.0-alpha.8

### Patch Changes

-   More subclass-friendly types in CoMap

## 0.7.0-alpha.7

### Patch Changes

-   Consistent proxy based API
-   Updated dependencies
    -   cojson@0.7.0-alpha.7

## 0.7.0-alpha.6

### Patch Changes

-   CoMap fix

## 0.7.0-alpha.5

### Patch Changes

-   Refactoring
-   Updated dependencies
    -   cojson@0.7.0-alpha.5

## 0.7.0-alpha.4

### Patch Changes

-   Make refs on list more precise

## 0.7.0-alpha.3

### Patch Changes

-   Make refs type more precise

## 0.7.0-alpha.2

### Patch Changes

-   Get rid of Co namespace

## 0.7.0-alpha.1

### Patch Changes

-   Use effect schema much less
-   Updated dependencies
    -   cojson@0.7.0-alpha.1

## 0.7.0-alpha.0

### Minor Changes

-   New simplified API

### Patch Changes

-   Updated dependencies
    -   cojson@0.7.0-alpha.0

## 0.6.1

### Patch Changes

-   Fix loading of accounts
-   Updated dependencies
    -   cojson@0.6.5

## 0.6.0

### Minor Changes

-   Make addMember and removeMember take loaded Accounts instead of just IDs

### Patch Changes

-   Updated dependencies
    -   cojson@0.6.0

## 0.5.0

### Minor Changes

-   Adding a lot of performance improvements to cojson, add a stresstest for the twit example and make that run smoother in a lot of ways.

### Patch Changes

-   Updated dependencies
    -   cojson@0.5.0
