import config from "@/config";
import { MdxData, MdxDocNav, MdxHeading } from "@/lib/mdx-types";
import { DocContent, DocMapScroller, DocsNav } from "./index";

interface PostProps {
  post: MdxData;
  docsList: MdxDocNav[];
  headings: MdxHeading[];
  // defines the URL path to the kind of doc
  kind: "guides" | "api";
}

export function Post({ post, docsList, headings, kind }: PostProps) {
  return (
    <div className="relative container max-w-fit md:flex pb-under-content pt-under-nav-content">
      <DocsNav docs={docsList} currentPath={kind} />
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
            url: `${config.PUBLIC_URL}/docs/${kind}/${post.slug}`,
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
