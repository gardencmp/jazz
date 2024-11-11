import createMDX from "@next/mdx";
import { visit, SKIP } from "unist-util-visit";
import { getHighlighter } from "shiki";
import withSlugs from "rehype-slug";
import { remarkHighlightPlugin, remarkHtmlToJsx } from "./lib/mdx-plugins.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
    pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
    transpilePackages: ["gcmp-design-system"],
    experimental: {
        serverActions: true,
    },
};

const withMDX = createMDX({
    options: {
        remarkPlugins: [remarkHighlightPlugin, remarkHtmlToJsx],
        rehypePlugins: [withSlugs],
    },
});

const config = {
    ...withMDX(nextConfig),
    output: "standalone",
};

export default config;
