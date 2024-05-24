# jazz-autosub

## 0.7.0-alpha.41

### Patch Changes

- Updated dependencies
  - cojson-transport-nodejs-ws@0.7.0-alpha.41
  - jazz-tools@0.7.0-alpha.41

## 0.7.0-alpha.39

### Patch Changes

- Updated dependencies
  - cojson@0.7.0-alpha.39
  - cojson-transport-nodejs-ws@0.7.0-alpha.39
  - jazz-tools@0.7.0-alpha.39

## 0.7.0-alpha.38

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - jazz-tools@0.7.0-alpha.38
  - cojson@0.7.0-alpha.38
  - cojson-transport-nodejs-ws@0.7.0-alpha.38

## 0.7.0-alpha.37

### Patch Changes

- Updated dependencies
  - cojson@0.7.0-alpha.37
  - cojson-transport-nodejs-ws@0.7.0-alpha.37
  - jazz-tools@0.7.0-alpha.37

## 0.7.0-alpha.36

### Patch Changes

- Ensure accounts are synced after creation
- Updated dependencies [1a35307]
- Updated dependencies [1a35307]
- Updated dependencies [1a35307]
- Updated dependencies [6b0418f]
- Updated dependencies [1a35307]
  - cojson@0.7.0-alpha.36
  - jazz-tools@0.7.0-alpha.36
  - cojson-transport-nodejs-ws@0.7.0-alpha.36

## 0.7.0-alpha.35

### Patch Changes

- Updated dependencies
- Updated dependencies
  - cojson@0.7.0-alpha.35
  - jazz-tools@0.7.0-alpha.35
  - cojson-transport-nodejs-ws@0.7.0-alpha.35

## 0.7.0-alpha.34

### Patch Changes

- Extract jazz cli into jazz-run package
- Updated dependencies
  - jazz-tools@0.7.0-alpha.34

## 0.7.0-alpha.32

### Patch Changes

- Introduce jazz-tools CLI
- Clean up exports

## 0.7.0-alpha.31

### Patch Changes

- Get rid of self generics, new create syntax

## 0.7.0-alpha.30

### Patch Changes

- CoValue casting & auto-subbing \_owner

## 0.7.0-alpha.29

### Patch Changes

- Reintroduce changes from main
- Updated dependencies
  - cojson@0.7.0-alpha.29

## 0.7.0-alpha.28

### Patch Changes

- Implement profile visibility based on groups & new migration signature
- Updated dependencies
  - cojson@0.7.0-alpha.28

## 0.7.0-alpha.27

### Patch Changes

- Fix CoList.splice / RawCoList.append
- Fix Costream[...].all
- Updated dependencies
  - cojson@0.7.0-alpha.27

## 0.7.0-alpha.26

### Patch Changes

- Fix CoMap.Record.toJSON()

## 0.7.0-alpha.25

### Patch Changes

- Make Account -> Profile a lazy ref schema

## 0.7.0-alpha.24

### Patch Changes

- Relax types of CoMap.\_schema
- Fix schema of Account & Group
- Make sure delete on CoMaps deletes keys
- Updated dependencies
  - cojson@0.7.0-alpha.24

## 0.7.0-alpha.23

### Patch Changes

- CoMap fixes and improvements

## 0.7.0-alpha.22

### Patch Changes

- Fix CoMap \_refs for co.items

## 0.7.0-alpha.21

### Patch Changes

- Add maxWidth option for loading images

## 0.7.0-alpha.20

### Patch Changes

- Make fast-check a direct dependency to help dev time resolution

## 0.7.0-alpha.19

### Patch Changes

- More precise imports from @effect/schema

## 0.7.0-alpha.17

### Patch Changes

- Use effect 3.0

## 0.7.0-alpha.16

### Patch Changes

- Make CoMaps even more subclassable

## 0.7.0-alpha.15

### Patch Changes

- More superclass-compatible CoMaps

## 0.7.0-alpha.14

### Patch Changes

- Fix CoStream types

## 0.7.0-alpha.13

### Patch Changes

- Add .all to CoStreamEntry

## 0.7.0-alpha.12

### Patch Changes

- Fix variance of ID.\_\_type

## 0.7.0-alpha.11

### Patch Changes

- Support stricter TS lint rules
- Updated dependencies
  - cojson@0.7.0-alpha.11

## 0.7.0-alpha.10

### Patch Changes

- Clean up API more & re-add jazz-nodejs
- Updated dependencies
  - cojson@0.7.0-alpha.10

## 0.7.0-alpha.9

### Patch Changes

- Even friendlier for subclassing CoMap

## 0.7.0-alpha.8

### Patch Changes

- More subclass-friendly types in CoMap

## 0.7.0-alpha.7

### Patch Changes

- Consistent proxy based API
- Updated dependencies
  - cojson@0.7.0-alpha.7

## 0.7.0-alpha.6

### Patch Changes

- CoMap fix

## 0.7.0-alpha.5

### Patch Changes

- Refactoring
- Updated dependencies
  - cojson@0.7.0-alpha.5

## 0.7.0-alpha.4

### Patch Changes

- Make refs on list more precise

## 0.7.0-alpha.3

### Patch Changes

- Make refs type more precise

## 0.7.0-alpha.2

### Patch Changes

- Get rid of Co namespace

## 0.7.0-alpha.1

### Patch Changes

- Use effect schema much less
- Updated dependencies
  - cojson@0.7.0-alpha.1

## 0.7.0-alpha.0

### Minor Changes

- New simplified API

### Patch Changes

- Updated dependencies
  - cojson@0.7.0-alpha.0

## 0.6.1

### Patch Changes

- Fix loading of accounts
- Updated dependencies
  - cojson@0.6.5

## 0.6.0

### Minor Changes

- Make addMember and removeMember take loaded Accounts instead of just IDs

### Patch Changes

- Updated dependencies
  - cojson@0.6.0

## 0.5.0

### Minor Changes

- Adding a lot of performance improvements to cojson, add a stresstest for the twit example and make that run smoother in a lot of ways.

### Patch Changes

- Updated dependencies
  - cojson@0.5.0
