export type Metadata = {
  title: string;
  publishedAt: string;
  summary: string;
  image?: string;
  link?: string;
};

export type ParsedContent = {
  metadata: Metadata;
  content: string;
};

export type MdxData = {
  metadata: Metadata;
  slug: string;
  content: string;
};

export interface MdxHeading {
  label: string;
  anchorLink: string;
  level: "h2" | "h3";
}
