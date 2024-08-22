export type DocKind = "guides" | "api"; //match the doc URL segment

export type Metadata = {
  kind: string;
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

export type MdxHeading = {
  label: string;
  anchorLink: string;
  level: "h2" | "h3";
};

export type MdxDocNav = {
  kind: string;
  slug: string;
  title: string;
  summary: string;
};
