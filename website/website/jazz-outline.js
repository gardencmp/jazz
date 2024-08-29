// The key nodes are:
// * children: Array of declarations (classes, interfaces, functions, etc.) with their signatures, parameters, return types, and documentation comments.
// * groups and categories: For organizing declarations.
// * packageName: The name of the package.
// * readme: The README content.
// * symbolIdMap and files: Source file information and mapping of declarations to source files.
// This structure allows TypeDoc to generate comprehensive documentation for an NPM package, including detailed information about the package's API, as well as the README content and source file references.

const dummy = {
  "id": "...",
  "name": "...",
  "children": [
    {
      "id": "...",
      "name": "...",
      "kind": "...", // Declaration kind (e.g., class, interface, function)
      "signatures": [ // For functions/methods
        {
          "parameters": [
            {
              "name": "...",
              "type": { ... } // Parameter type information
            },
            ...
          ],
          "type": { ... } // Return type information
        },
        ...
      ],
      "comment": { ... } // Documentation comments
    },
    ...
  ],
  "groups": [...], // Groups for organizing declarations
  "categories": [...], // Categories for organizing declarations
  "packageName": "...",
  "readme": [...], // README content
  "symbolIdMap": { ... }, // Mapping of symbol IDs to source file information
  "files": {
    "entries": { ... }, // Source file information
    "reflections": { ... } // Reflections (declarations) per source file
  }
}
