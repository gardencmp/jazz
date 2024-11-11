// app/docs/[...slug]/page.tsx

import React from "react";

// app/docs/[...slug]/page.tsx

import fs from "fs";
import path from "path";

export async function generateStaticParams() {
    const docsDirectory = path.join(process.cwd(), "app", "docs");
    const slugs = getAllMDXSlugs(docsDirectory);

    return slugs.map((slug) => ({
        slug: slug.split("/").filter(Boolean), // Convert slug string to array
    }));
}

// Helper function to recursively get all slugs
function getAllMDXSlugs(dir: string, relativePath = ""): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let slugs: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const entryRelativePath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
            slugs = slugs.concat(getAllMDXSlugs(fullPath, entryRelativePath));
        } else if (entry.isFile() && entry.name === "page.mdx") {
            const slug = path.dirname(entryRelativePath); // Remove 'page.mdx' from the path
            slugs.push(slug);
        }
    }

    return slugs;
}

// Rest of your page code...

interface PageProps {
    params: { slug: string[] };
}

export default function DocsPage(props: PageProps) {
    console.log("DocsPage props", props);
    // The content is already handled by the layout
    // return <MDXRemote source={markdown} />;
    return <></>;
}
