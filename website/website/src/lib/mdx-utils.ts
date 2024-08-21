import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MdxHeading, ParsedContent, MdxData, Metadata } from "./mdx-types";

export function parseFrontmatter(fileContent: string): ParsedContent {
  let frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  let match = frontmatterRegex.exec(fileContent);
  let frontMatterBlock = match![1];
  let content = fileContent.replace(frontmatterRegex, "").trim();
  let frontMatterLines = frontMatterBlock.trim().split("\n");
  let metadata: Partial<Metadata> = {};

  frontMatterLines.forEach((line) => {
    let [key, ...valueArr] = line.split(": ");
    let value = valueArr.join(": ").trim();
    value = value.replace(/^['"](.*)['"]$/, "$1"); // Remove quotes
    metadata[key.trim() as keyof Metadata] = value;
  });

  return { metadata: metadata as Metadata, content };
}

function getMDXFiles(dir: string): string[] {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string): ParsedContent {
  let rawContent = fs.readFileSync(filePath, "utf-8");
  return parseFrontmatter(rawContent);
}

function getMdxData(dir: string): MdxData[] {
  let mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    let { metadata, content } = readMDXFile(path.join(dir, file));
    let slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}

export function getBlogPosts(): MdxData[] {
  return getMdxData(path.join(process.cwd(), "src", "app", "blog", "posts"));
}

export function getDocPosts(): MdxData[] {
  return getMdxData(path.join(process.cwd(), "src", "app", "docs", "content"));
}

export function formatDate(date: string, includeRelative = false) {
  let currentDate = new Date();
  if (!date.includes("T")) {
    date = `${date}T00:00:00`;
  }
  let targetDate = new Date(date);

  let yearsAgo = currentDate.getFullYear() - targetDate.getFullYear();
  let monthsAgo = currentDate.getMonth() - targetDate.getMonth();
  let daysAgo = currentDate.getDate() - targetDate.getDate();

  let formattedDate = "";

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`;
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`;
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`;
  } else {
    formattedDate = "Today";
  }

  let fullDate = targetDate.toLocaleString("en-us", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (!includeRelative) {
    return fullDate;
  }

  return `${fullDate} (${formattedDate})`;
}

export function extractHeadings(content: string): MdxHeading[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: MdxHeading[] = [];

  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length === 2 ? "h2" : "h3",
      label: match[2],
      anchorLink: `#${match[2].toLowerCase().replace(/\s+/g, "-")}`,
    });
  }

  return headings;
}

export function getDocsList() {
  const docsDirectory = path.join(process.cwd(), "src/app/docs/content");
  const fileNames = fs.readdirSync(docsDirectory);

  return fileNames
    .filter((fileName) => fileName !== ".DS_Store" && fileName.endsWith(".mdx"))
    .map((fileName) => {
      const fullPath = path.join(docsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);

      return {
        slug: fileName.replace(/\.mdx$/, ""),
        title: data.title,
        summary: data.summary,
      };
    });
}

export async function getContent(contentPath: string, fileNames: string[]) {
  const filePaths = fileNames.map((name) =>
    path.join(process.cwd(), `${contentPath}/${name}.mdx`),
  );

  const fileContents = await Promise.all(
    filePaths.map((filePath) => fs.readFileSync(filePath, "utf8")),
  );

  return Object.fromEntries(
    fileNames.map((name, index) => [
      name,
      parseFrontmatter(fileContents[index]),
    ]),
  );
}
