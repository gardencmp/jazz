import { DocNav } from "@/components/docs/nav";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// export const metadata = {
//     title: "Docs",
//     description: "Jazz Guide & Docs.",
// };

import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit, SKIP } from "unist-util-visit";
import remarkStringify from "remark-stringify"; // Import remark-stringify

import {
    extractMetadataAndTOC,
    TOCItem,
} from "../../lib/extractMetadataAndTOC";

export function remarkExtractTOC() {
    return (tree, file) => {
        const toc = [];
        const idCounts = {};

        visit(tree, "heading", (node) => {
            let text = node.children
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

export async function generateMetadatax({
    params,
}: {
    params: { slug: string };
}): Promise<{
    title: string;
    description: string;
    toc: TOCItem[];
}> {
    const { slug } = params;
    const mdxPath = path.join(
        process.cwd(),
        "app/docs/project-setup/react-native/page.mdx", // Consider using slug dynamically
    );

    try {
        const source = fs.readFileSync(mdxPath, "utf8");

        console.log("MDX Source:", source); // Debugging: Check if source includes frontmatter

        // Extract frontmatter and content using gray-matter
        const { data, content } = matter(source);

        console.log("Frontmatter Data:", data); // Should log title and description

        // Initialize the processor with remark plugins
        const processor = unified()
            .use(remarkParse)
            .use(remarkExtractTOC)
            .use(remarkStringify);

        // Process the content and extract TOC
        const file = await processor.process(content);

        // Extract TOC from the file's data
        const toc = file.data.toc || [];

        console.log("Extracted TOC:", toc); // Should log the TOC array

        return {
            title: data.title || "Untitled",
            description: data.description || "",
            toc,
        };
    } catch (error) {
        console.error(`Error processing MDX file at ${mdxPath}:`, error);
        return {
            title: "Untitled",
            description: "",
            toc: [],
        };
    }
}

export default async function DocsLayout(props: any) {
    const mdxPath = path.join(
        process.cwd(),
        "app/docs/project-setup/react-native/page.mdx",
    );

    try {
        const metadata = await extractMetadataAndTOC(mdxPath);
        const toc = metadata.toc;

        console.log("layout Extracted TOC:", toc);
        console.log("props", props);
        return (
            <div className="container relative grid grid-cols-12 gap-5 py-8">
                <DocNav />
                <Prose className="md:col-span-8 lg:col-span-9">
                    {props.children}
                </Prose>
            </div>
        );
    } catch (error) {
        console.error(`Error processing MDX file at ${mdxPath}:`, error);
        return <div>Error loading MDX file</div>;
    }
}
