import { getMdxData, getDocsList, extractHeadings } from "@/lib/mdx-utils";
import { notFound } from "next/navigation";
import {
  Post,
  generateMetadata as generateMetadataComponent,
} from "../../(components)";
import path from "path";

const docsDir = path.join(process.cwd(), "src/app/docs/(content)");

function getPost(slug: string) {
  let allDocs = getMdxData(docsDir);
  return allDocs.find((doc) => doc.slug === slug);
}

export default function GuideSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPost(params.slug);
  if (!post) {
    notFound();
  }

  const docsList = getDocsList(docsDir);
  const headings = extractHeadings(post.content);
  // console.log("post", post);
  // console.log("docsList", docsList);

  return (
    <Post post={post} docsList={docsList} headings={headings} kind="guides" />
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
