import { getHighlighter } from "shiki";
import { visit, SKIP } from "unist-util-visit";

export function remarkHighlightPlugin() {
    return async function transformer(tree) {
        const highlighter = await getHighlighter({
            langs: ["typescript", "bash", "tsx", "json"],
            theme: "css-variables", // use the theme
        });

        visit(tree, "code", visitor);

        // console.log("highlighter", highlighter);

        function visitor(node) {
            // console.log("nodex", node);
            const lines = highlighter.codeToThemedTokens(
                node.value,
                node.lang, // "json",
                "css-variables",
            );

            console.log("linesx", lines);

            let lineNo = -1;

            node.type = "html";
            node.value = `<code class="not-prose py-2 flex flex-col leading-relaxed">${lines
                .map((line) => {
                    let lineClassName = "";

                    const isSubduedLine = line.some((token) =>
                        token.content.includes("// old"),
                    );
                    const isBinnedLine = line.some((token) =>
                        token.content.includes("// *bin*"),
                    );
                    const isHighlighted = line.some((token) =>
                        token.content.includes("// *highlight*"),
                    );
                    if (!isBinnedLine) {
                        lineNo++;
                    }

                    if (isBinnedLine) {
                        lineClassName = "bg-red-100 dark:bg-red-800";
                    } else if (isHighlighted) {
                        lineClassName =
                            "my-0.5 bg-blue-50 text-blue dark:bg-stone-900 dark:text-blue-300";
                    }

                    return (
                        `<span class="block px-3 min-h-[1em] ${lineClassName}" style="${isBinnedLine ? "user-select: none" : ""}">` +
                        line
                            .map((token) => {
                                let color = isHighlighted
                                    ? "currentColor"
                                    : token.color;
                                return `<span style="color: ${color};${isSubduedLine ? "opacity: 0.4;" : ""}">${escape(token.content.replace("// old", "").replace("// *bin*", "").replace("// *highlight*", ""))}</span>`;
                            })
                            .join("") +
                        "</span>"
                    );
                })
                .join("\n")}</code>`;

            console.log("node.value", node.value);

            node.children = [];
            return SKIP;
        }
    };
}

export function remarkHtmlToJsx() {
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
            console.log("escapedHtml", escapedHtml);
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

export function remarkExtractTOC() {
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

        file.data.toc = toc;
    };
}

function escape(s) {
    return s.replace(/[^0-9A-Za-z ]/g, (c) => "&#" + c.charCodeAt(0) + ";");
}
