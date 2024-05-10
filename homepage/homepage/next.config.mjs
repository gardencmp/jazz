import createMDX from "@next/mdx";
import { visit, SKIP } from "unist-util-visit";
import { getHighlighter } from "shiki";

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configure `pageExtensions`` to include MDX files
    pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
    // Optionally, add any other Next.js config below
    experimental: {
        serverActions: true,
    },
};

const withMDX = createMDX({
    // Add markdown plugins here, as desired
    options: {
        remarkPlugins: [highlightPlugin, remarkHtmlToJsx],
        rehypePlugins: [],
    },
});

const config = {
    ...withMDX(nextConfig),
    output: "standalone",
};

function highlightPlugin() {
    return async function transformer(tree) {
        const highlighter = await getHighlighter({
            langs: ["typescript", "bash", "tsx"],
            theme: "css-variables", // use the theme
        });

        visit(tree, "code", visitor);

        function visitor(node) {
            const lines = highlighter.codeToThemedTokens(
                node.value,
                node.lang,
                "css-variables"
            );

            // match a meta tag like `subtle=0,1,2,3` and parse out the line numbers
            const subtleTag = node.meta && node.meta.match(/subtle=\S+/);
            const subtle = subtleTag && subtleTag[0].split("=")[1].split(",").map(Number);

            node.type = "html";
            node.value = `<pre><code class="not-prose">${lines
                .map((line, lineI) =>
                    line
                        .map(
                            (token) =>
                                `<span style="color: ${token.color};${subtle?.includes(lineI+1) ? "opacity: 0.3;" : ""}">${escape(token.content)}</span>`
                        )
                        .join("")
                )
                .join("\n")}</code></pre>`;
            node.children = [];
            return SKIP;
        }
    };
}

function escape(s) {
    return s.replace(
        /[^0-9A-Za-z ]/g,
        c => "&#" + c.charCodeAt(0) + ";"
    );
}

function remarkHtmlToJsx() {
    async function transform(...args) {
        // Async import since these packages are all in ESM
        const { visit, SKIP } = await import("unist-util-visit");
        const { mdxFromMarkdown } = await import("mdast-util-mdx");
        const { fromMarkdown } = await import("mdast-util-from-markdown");
        const { mdxjs } = await import("micromark-extension-mdxjs");

        // This is a horror show, but it's the only way I could get the raw HTML into MDX.
        const [ast] = args;
        visit(ast, "html", (node) => {
            const escapedHtml = JSON.stringify(node.value);
            const jsx = `<div dangerouslySetInnerHTML={{__html: ${escapedHtml} }}/>`;
            const rawHtmlNode = fromMarkdown(jsx, {
                extensions: [mdxjs()],
                mdastExtensions: [mdxFromMarkdown()],
            }).children[0];

            Object.assign(node, rawHtmlNode);

            return SKIP;
        });
    }

    return transform;
}

export default config;
