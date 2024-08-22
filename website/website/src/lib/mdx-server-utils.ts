import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MdxHeading, ParsedContent, MdxData, Metadata } from "./mdx-types";

export function getMDXFiles(dir: string): string[] {
  return fs.readdirSync(dir).filter((file) => file.endsWith(".mdx"));
}

export function readMDXFile(filePath: string): ParsedContent {
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  return { metadata: data as Metadata, content };
}

export async function getMdxData(dir: string): Promise<MdxData[]> {
  const files = await fs.promises.readdir(dir);
  const mdxFiles = files.filter((file) => file.endsWith(".mdx"));

  const mdxDataPromises = mdxFiles.map(async (file) => {
    const filePath = path.join(dir, file);
    const { metadata, content } = await readMDXFile(filePath);
    return {
      metadata,
      slug: file.replace(/\.mdx$/, ""),
      content,
    };
  });

  return Promise.all(mdxDataPromises);
}

export async function getDocsList(dir: string) {
  const docs = await getMdxData(dir);
  return docs.map(({ metadata, slug }) => ({
    kind: metadata.kind,
    slug,
    title: metadata.title,
    summary: metadata.summary,
  }));
}

export function extractHeadings(content: string): MdxHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const matches = content.match(headingRegex) || [];
  return matches.map((match) => {
    const [, hashes, text] = match.match(/^(#{2,3})\s+(.+)$/) || [];
    return {
      level: hashes.length === 2 ? "h2" : "h3",
      label: text,
      anchorLink: `#${text.toLowerCase().replace(/\s+/g, "-")}`,
    };
  });
}
