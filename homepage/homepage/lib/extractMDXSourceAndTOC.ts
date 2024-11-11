import fs from "fs/promises";
import matter from "gray-matter";
import rehypeShiki from "@shikijs/rehype";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import rehypeRaw from "rehype-raw";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import * as shiki from "shiki";

import {
    remarkExtractTOC,
    remarkHighlightPlugin,
    remarkHtmlToJsx,
} from "./mdx-plugins.mjs";

export interface TOCItem {
    depth: number;
    text: string;
    id: string;
}

export interface MDXContents {
    source: string;
    toc: TOCItem[];
}

import rehypeHighlight from "rehype-highlight";

/**
 * Extracts metadata and TOC from an MDX file.
 *
 * @param mdxPath - The absolute path to the MDX file.
 * @returns An object containing title, description, and toc.
 */
export async function extractMDXSourceAndTOC(
    mdxPath: string,
): Promise<MDXContents> {
    const source = await fs.readFile(mdxPath, "utf8");

    // Extract frontmatter and content using gray-matter
    // const { data, content } = matter(source);

    // Initialize the processor with remark plugins and a compiler
    const processor = unified()
        .use(remarkParse)
        .use(remarkExtractTOC)
        // .use(remarkRehype, { allowDangerousHtml: true })
        // .use(rehypeHighlight)
        // .use(rehypeShiki, {
        //     theme: "light-plus",
        // })
        .use(remarkHighlightPlugin)
        // .use(remarkHtmlToJsx)
        // .use(rehypeRaw)
        .use(remarkStringify); // Adds compiler to satisfy `process` requirements
    // .use(rehypeStringify, { allowDangerousHtml: true });

    // Process the content and extract TOC
    const file = await processor.process(source);

    // Extract TOC from the file's data and ensure type safety
    const toc: TOCItem[] = (file.data.toc as TOCItem[]) || [];

    // console.log("source", source);

    return {
        toc,
        source,
    };
}

import { compile } from "@mdx-js/mdx";
import { serialize } from "next-mdx-remote/serialize";
// import rehypeRaw from "rehype-raw"; // Import rehype-raw

// export async function extractMDXSourceAndTOC(mdxPath: string) {
//     const source = await fs.readFile(mdxPath, "utf8");

//     // Extract frontmatter and content using gray-matter
//     const { data, content } = matter(source);

//     // Compile MDX with @mdx-js/mdx
//     const compiledMDX = await compile(content, {
//         remarkPlugins: [
//             remarkParse,
//             remarkHighlightPlugin,
//             remarkExtractTOC,
//             remarkStringify,
//             remarkHtmlToJsx,
//         ],
//         rehypePlugins: [], // Add any rehype plugins if necessary
//         jsx: true, // Enables JSX syntax in the MDX
//     });

//     // Serialize the MDX to a format compatible with MDXRemote
//     const mdxSource = await serialize(String(compiledMDX));

//     // You might want to extract the TOC from frontmatter if added there
//     const toc = data.toc || []; // Assume `remarkExtractTOC` adds `toc` to frontmatter

//     return {
//         toc,
//         source: mdxSource,
//     };
// }

////

// export async function extractMDXSourceAndTOC(mdxPath) {
//     // Read the MDX file
//     const source = await fs.readFile(mdxPath, "utf8");

//     // Extract frontmatter and content using gray-matter
//     const { data, content } = matter(source);

//     // Serialize the MDX content to a format compatible with MDXRemote
//     const mdxSource = await serialize(content, {
//         mdxOptions: {
//             // jsx: true,
//             // format: "mdx",
//             remarkPlugins: [
//                 // remarkParse,
//                 // remarkHighlightPlugin,
//                 // remarkExtractTOC,
//                 // remarkStringify,
//             ], // Add your remark plugins here
//             rehypePlugins: [], // Add your rehype plugins here

//             // You can add more options as needed
//         },
//         // Optionally, pass the frontmatter data to MDX
//         // scope: data,
//     });

//     console.log("mdxSource", mdxSource.compiledSource);

//     // Extract TOC from frontmatter or from the plugin's result
//     const toc = data.toc || []; // Adjust based on how `remarkExtractToc` provides TOC

//     return {
//         toc,
//         source: mdxSource,
//     };
// }
