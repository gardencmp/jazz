import config from "@/config";
import { getMdxData } from "@/lib/mdx-utils";
import path from "path";

const docsDir = path.join(process.cwd(), "src/app/docs/(content)");

export function GET() {
  let allDocs = getMdxData(docsDir);

  const itemsXml = allDocs
    .sort((a, b) => {
      if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
        return -1;
      }
      return 1;
    })
    .map(
      (post) =>
        `<item>
          <title>${post.metadata.title}</title>
          <link>${config.PUBLIC_URL}/blog/${post.slug}</link>
          <description>${post.metadata.summary || ""}</description>
          <pubDate>${new Date(
            post.metadata.publishedAt,
          ).toUTCString()}</pubDate>
        </item>`,
    )
    .join("\n");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
    <channel>
        <title>${config.DEFAULT_TITLE}</title>
        <link>${config.PUBLIC_URL}</link>
        <description>${config.DEFAULT_DESCRIPTION}</description>
        ${itemsXml}
    </channel>
  </rss>`;

  return new Response(rssFeed, {
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
