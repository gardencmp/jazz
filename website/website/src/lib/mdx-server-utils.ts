import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { MdxHeading, Metadata, ParsedContent } from "./mdx-types";

const MDX_EXTENSION = ".mdx";

export function getMDXFiles(dir: string): string[] {
  return fs.readdirSync(dir).filter((file) => file.endsWith(MDX_EXTENSION));
}

export function readMDXFile(filePath: string): ParsedContent {
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  return { metadata: data as Metadata, content };
}

export function getMdxData(dir: string) {
  let mdxFiles = getMDXFiles(dir);

  return mdxFiles.map((file) => {
    const filePath = path.join(dir, file);
    const { metadata, content } = readMDXFile(filePath);
    // const slug = path.basename(file, path.extname(file));
    const slug = file.replace(new RegExp(`${MDX_EXTENSION}$`), "");

    return {
      metadata,
      slug,
      content,
    };
  });
}

// function getMDXData(dir) {
//   let mdxFiles = getMDXFiles(dir);
//   return mdxFiles.map((file) => {
//     let { metadata, content } = readMDXFile(path.join(dir, file));
//     let slug = path.basename(file, path.extname(file));
//     let tweetIds = extractTweetIds(content);
//     return {
//       metadata,
//       slug,
//       tweetIds,
//       content,
//     };
//   });
// }

export function getBlogPosts() {
  return getMdxData(path.join(process.cwd(), "content"));
}

export function getDocsList(dir: string) {
  const docs = getMdxData(dir);
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
