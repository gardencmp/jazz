---
"jazz-tools": patch
---

Added SchemaUnion.Of(), a new API that lets you express unions of other Schema definitions (often different subclasses of a parent Schema class) that are correctly narrowed in TypeScript and correctly instantiated at runtime based on a discriminating field in the raw loaded CoValue.
