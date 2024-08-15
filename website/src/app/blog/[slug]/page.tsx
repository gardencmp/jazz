import { notFound } from "next/navigation";
import { CustomMDX } from "@/components/mdx";
import { formatDate, getBlogPosts } from "@/lib/mdx-utils";
import config from "@/config";

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
  let posts = getBlogPosts();

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
  let post = getBlogPosts().find((post) => post.slug === params.slug);
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

interface BlogProps {
  params: {
    slug: string;
  };
}

export default function Blog({ params }: BlogProps) {
  let post = getBlogPosts().find((post) => post.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <section className="container">
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
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {post.metadata.title}
      </h1>
      <div className="flex justify-between items-center mt-2 mb-8 text-sm">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {formatDate(post.metadata.publishedAt)}
        </p>
      </div>
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
    </section>
  );
}
