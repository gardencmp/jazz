import config from "@/config";
import { extractHeadings, getDocPosts, getDocsList } from "@/lib/mdx-utils";
import { notFound } from "next/navigation";
import { DocContent } from "../(components)/doc-content";
import { DocMapScroller } from "../(components)/doc-scroller";
import { DocsNav } from "../(components)/docs-nav";

interface Props {
  params: {
    slug: string;
  };
}

export default function Doc({ params }: Props) {
  const docsList = getDocsList();
  let post = getDocPosts().find((post) => post.slug === params.slug);

  if (!post) {
    notFound();
  }

  const headings = extractHeadings(post.content);

  return (
    <div className="relative container max-w-fit md:flex">
      <DocsNav guideDocs={docsList} />
      <DocContent post={post} />
      <DocMapScroller headings={headings} />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${config.PUBLIC_URL}${post.metadata.image}`
              : `${config.PUBLIC_URL}/og?title=${encodeURIComponent(
                  post.metadata.title,
                )}`,
            url: `${config.PUBLIC_URL}/blog/${post.slug}`,
            author: {
              "@type": "Person",
              name: "My Portfolio",
            },
          }),
        }}
      />
    </div>
  );
}

interface GenerateStaticParamsResult {
  slug: string;
}

interface GenerateMetadataProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams(): Promise<
  GenerateStaticParamsResult[]
> {
  let posts = getDocPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

interface GenerateMetadataResult {
  title: string;
  description: string;
  openGraph: {
    title: string;
    description: string;
    type: string;
    publishedTime: string;
    url: string;
    images: Array<{ url: string }>;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    images: string[];
  };
}

export function generateMetadata({
  params,
}: GenerateMetadataProps): GenerateMetadataResult {
  let post = getDocPosts().find((post) => post.slug === params.slug);
  if (!post) {
    return notFound();
  }

  let {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata;
  let ogImage = image
    ? image
    : `${config.PUBLIC_URL}/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: `${config.PUBLIC_URL}/blog/${post.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
