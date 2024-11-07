// lib/extractMetadataAndTOC.ts

import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkExtractTOC from "./remark-extract-toc.mjs";

export interface TOCItem {
    depth: number;
    text: string;
    id: string;
}

export interface Metadata {
    title: string;
    description: string;
    toc: TOCItem[];
}

/**
 * Extracts metadata and TOC from an MDX file.
 *
 * @param mdxPath - The absolute path to the MDX file.
 * @returns An object containing title, description, and toc.
 */
export async function extractMetadataAndTOC(
    mdxPath: string,
): Promise<Metadata> {
    const source = await fs.readFile(mdxPath, "utf8");

    // Extract frontmatter and content using gray-matter
    const { data, content } = matter(source);

    // Initialize the processor with remark plugins and a compiler
    const processor = unified()
        .use(remarkParse)
        .use(remarkExtractTOC)
        .use(remarkStringify); // Adds compiler to satisfy `process` requirements

    // Process the content and extract TOC
    const file = await processor.process(content);

    // Extract TOC from the file's data
    const toc: TOCItem[] = file.data.toc || [];

    return {
        title: data.title || "Untitled",
        description: data.description || "",
        toc,
    };
}
