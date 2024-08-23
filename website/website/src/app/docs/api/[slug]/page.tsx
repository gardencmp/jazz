import {
  getMdxData,
  getDocsList,
  extractHeadings,
} from "@/lib/mdx-server-utils";
import { notFound } from "next/navigation";
import {
  Post,
  generateMetadata as generateMetadataComponent,
} from "../../(components)";
import path from "path";

const docsDir = path.join(process.cwd(), "src/app/docs/(content)");

async function getPost(slug: string) {
  let allDocs = await getMdxData(docsDir);
  return allDocs.find((doc) => doc.slug === slug);
}

export default async function ApiSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  if (!post) {
    notFound();
  }

  const docsList = await getDocsList(docsDir);
  const headings = extractHeadings(post.content);

  return (
    <Post post={post} docsList={docsList} headings={headings} kind="api" />
  );
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);
  if (!post) {
    notFound();
  }
  return generateMetadataComponent({ doc: post });
}

export async function generateStaticParams() {
  const allDocs = await getMdxData(docsDir);
  return allDocs.map((doc) => ({
    slug: doc.slug,
  }));
}
