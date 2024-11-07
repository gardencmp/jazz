// lib/remark-extract-toc.ts

import { visit } from "unist-util-visit";

export default function remarkExtractTOC() {
    return (tree, file) => {
        const toc = [];
        const idCounts = {};

        visit(tree, "heading", (node) => {
            const text = node.children
                .filter(
                    (child) =>
                        child.type === "text" || child.type === "inlineCode",
                )
                .map((child) => child.value)
                .join("");

            let id = text
                .toLowerCase()
                .replace(/[^\w]+/g, "-")
                .replace(/^-+|-+$/g, "");

            // Ensure unique ID
            if (idCounts[id]) {
                idCounts[id] += 1;
                id = `${id}-${idCounts[id]}`;
            } else {
                idCounts[id] = 1;
            }

            toc.push({
                depth: node.depth,
                text,
                id,
            });
        });

        console.log("toc", toc);

        // Store TOC in file.data
        file.data.toc = toc;
    };
}
