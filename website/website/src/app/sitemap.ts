import { getMdxData } from "@/lib/mdx-utils";
import config from "@/config";
import path from "path";

const guidesDir = path.join(process.cwd(), "src/app/docs/guides/(content)");
const apiDir = path.join(process.cwd(), "src/app/docs/api/(content)");

export default async function sitemap() {
  let guides = (await getMdxData(guidesDir)).map((post) => ({
    url: `${config.PUBLIC_URL}/docs/guides/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  let apis = (await getMdxData(apiDir)).map((post) => ({
    url: `${config.PUBLIC_URL}/docs/api/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  let routes = ["", "/docs", "/mesh"].map((route) => ({
    url: `${config.PUBLIC_URL}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...guides, ...apis];
}
