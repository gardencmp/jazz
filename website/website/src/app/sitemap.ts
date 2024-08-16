import { getBlogPosts } from "@/lib/mdx-utils";
import config from "@/config";

export default async function sitemap() {
  let blogs = getBlogPosts().map((post) => ({
    url: `${config.PUBLIC_URL}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  let routes = ["", "/blog"].map((route) => ({
    url: `${config.PUBLIC_URL}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...blogs];
}
