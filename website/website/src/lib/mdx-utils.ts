import { MdxHeading } from "./mdx-types";

// export function extractHeadings(content: string): MdxHeading[] {
//   const headingLines = content.split("\n").filter((line) => line.match(/^#{2,3} /));
//   return headingLines.map((line) => {
//     const level = line.indexOf(" ");
//     const text = line.slice(level + 1);
//     return { level, text };
//   });
// }

// export function extractHeadings(content: string): MdxHeading[] {
//   const headingRegex = /^(#{2,3})\s+(.+)$/gm;
//   return Array.from(content.matchAll(headingRegex)).map(([, hashes, text]) => ({
//     level: hashes.length === 2 ? "h2" : "h3",
//     label: text,
//     anchorLink: `#${text.toLowerCase().replace(/\s+/g, "-")}`,
//   }));
// }

// export function extractHeadings(content: string): MdxHeading[] {
//   const headingRegex = /^(#{2,3})\s+(.+)$/gm;
//   const headings: MdxHeading[] = [];

//   let match;
//   while ((match = headingRegex.exec(content)) !== null) {
//     headings.push({
//       level: match[1].length === 2 ? "h2" : "h3",
//       label: match[2],
//       anchorLink: `#${match[2].toLowerCase().replace(/\s+/g, "-")}`,
//     });
//   }

//   return headings;
// }

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
