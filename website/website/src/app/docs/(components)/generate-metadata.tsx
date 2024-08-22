import config from "@/config";
import { MdxData } from "@/lib/mdx-types";

export function generateMetadata({ doc }: { doc: MdxData }) {
  const path = doc.metadata.kind === "guides" ? "docs/guides" : "docs/api";

  let {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = doc.metadata;
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
      url: `${config.PUBLIC_URL}/${path}/${doc.slug}`,
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
