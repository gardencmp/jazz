import { getMdxData, getDocsList, extractHeadings } from "@/lib/mdx-utils";
import { notFound } from "next/navigation";
import {
  Post,
  generateMetadata as generateMetadataComponent,
} from "../../(components)";
import path from "path";

const docsDir = path.join(process.cwd(), "src/app/docs/api/(content)");

function getPost(slug: string) {
  let allDocs = getMdxData(docsDir);
  // console.log(allDocs);
  return allDocs.find((doc) => doc.slug === slug);
}

export default function ApiSlugPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) {
    notFound();
  }

  const docsList = getDocsList(docsDir);
  const headings = extractHeadings(post.content);

  return (
    <Post post={post} docsList={docsList} headings={headings} kind="api" />
  );
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) {
    notFound();
  }
  return generateMetadataComponent({ doc: post });
}

export async function generateStaticParams() {
  const allDocs = getMdxData(docsDir);
  return allDocs.map((doc) => ({
    slug: doc.slug,
  }));
}
