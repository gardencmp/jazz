// app/docs/[...slug]/layout.tsx

import React from "react";
import { DocNav } from "@/components/docs/nav";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import path from "path";
import { extractMDXSourceAndTOC, TOCItem } from "@/lib/extractMDXSourceAndTOC";
import { MDXRemote } from "next-mdx-remote/rsc";
import { CodeGroup } from "@/components/forMdx"; // Import your custom components
import { TOC } from "@/components/TOC";
import { compile, evaluate, run } from "@mdx-js/mdx";

// import TOC from "@/components/TOC";

// Define the LayoutProps interface
interface LayoutProps {
    children: React.ReactNode;
    params: { slug: string[] };
}

import * as runtime from "react/jsx-runtime";

export default async function DocsLayout({ children, params }: LayoutProps) {
    const { slug } = params;
    const mdxPath = path.join(
        process.cwd(),
        "content",
        "docs",
        ...slug,
        "page.mdx",
    );

    try {
        const { toc, source } = await extractMDXSourceAndTOC(mdxPath);

        return (
            <div className="container relative flex justify-between gap-5 py-8">
                <DocNav className="w-1/4" />
                <Prose className="w-1/2">
                    {children}
                    <MDXRemote source={source} components={{ CodeGroup }} />
                </Prose>
                <aside className="toc-sidebar w-1/4">
                    <TOC toc={toc} />
                </aside>
            </div>
        );
    } catch (error) {
        console.error(`Error processing MDX file at ${mdxPath}:`, error);
        return <div>Error loading documentation.</div>;
    }
}
