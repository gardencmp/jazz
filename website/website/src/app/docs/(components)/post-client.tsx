"use client";

import config from "@/config";
import { usePathname } from "next/navigation";
import { MdxData, MdxDocNav, MdxHeading } from "@/lib/mdx-types";
import { DocContent, DocMapScroller, DocsNav } from "./index";

interface ClientPostProps {
  post: MdxData;
  docsList: MdxDocNav[];
  headings: MdxHeading[];
}

export function ClientPost({ post, docsList, headings }: ClientPostProps) {
  const pathname = usePathname();
  const segments = pathname.split("/");
  const lastSegment = segments[segments.length - 2]; // 'guides' or 'api'
  const path = `docs/${lastSegment}`;

  return (
    <div className="relative container max-w-fit md:flex pb-under-content pt-under-nav-content">
      <DocsNav docs={docsList} currentPath={lastSegment} />
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
            url: `${config.PUBLIC_URL}/${path}/${post.slug}`,
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
