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
                "css-variables",
            );

            let lineNo = -1;

            node.type = "html";
            node.value = `<pre><code class="not-prose">${lines
                .map((line) => {
                    const isSubduedLine = line.some((token) =>
                        token.content.includes("// old"),
                    );
                    const isBinnedLine = line.some((token) =>
                        token.content.includes("// *bin*"),
                    );
                    if (!isBinnedLine) {
                        lineNo++;
                    }
                    return (
                        `<span class="line" style="${isBinnedLine ? "opacity: 0.3; text-decoration: line-through; user-select: none" : ""}"><div class="lineNo" style="${isSubduedLine ? "opacity: 0.3;" : ""}${isBinnedLine ? "color: red;" : ""}">${node.lang === "bash" ? ">" : isBinnedLine ? "✕" : (lineNo + 1)}</div>` +
                        line
                            .map(
                                (token) =>
                                    `<span style="color: ${isBinnedLine ? "red" : token.color};${isSubduedLine ? "opacity: 0.3;" : ""}">${escape(token.content.replace("// old", "").replace("// *bin*", ""))}</span>`,
                            )
                            .join("") +
                        "</span>"
                    );
                })
                .join("\n")}</code></pre>`;
            node.children = [];
            return SKIP;
        }
    };
}

function escape(s) {
    return s.replace(/[^0-9A-Za-z ]/g, (c) => "&#" + c.charCodeAt(0) + ";");
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
