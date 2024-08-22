import { getDocPosts } from "@/lib/mdx-utils";
import config from "@/config";

export default async function sitemap() {
  let docs = getDocPosts().map((post) => ({
    url: `${config.PUBLIC_URL}/docs/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  let routes = ["", "/docs", "/mesh"].map((route) => ({
    url: `${config.PUBLIC_URL}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...docs];
}
