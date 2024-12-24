import DocsLayout from "@/app/docs/[framework]/(others)/layout";
import { DocsLayout as DocsLayoutWithToc } from "@/components/docs/DocsLayout";
import { TableOfContents } from "@/components/docs/TableOfContents";
import ComingSoonPage from "@/components/docs/coming-soon.mdx";
import { DocNav } from "@/components/docs/nav";
import { docNavigationItems } from "@/lib/docNavigationItems";
import { Framework, frameworks } from "@/lib/framework";
import type { Toc } from "@stefanprobst/rehype-extract-toc";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";

export default async function Page({
  params: { slug, framework },
}: { params: { slug: string[]; framework: string } }) {
  const slugPath = slug.join("/");

  try {
    let mdxSource;
    try {
      mdxSource = await import(`./${slugPath}.mdx`);
    } catch (error) {
      mdxSource = await import(`./${slugPath}/${framework}.mdx`);
    }

    const { default: Content, tableOfContents } = mdxSource;

    return (
      <DocsLayoutWithToc
        nav={<DocNav className="text-sm" />}
        tableOfContents={tableOfContents as Toc}
      >
        <Prose className="overflow-x-hidden lg:flex-1  py-8">
          <Content />
        </Prose>
      </DocsLayoutWithToc>
    );
  } catch (error) {
    return (
      <DocsLayout>
        <ComingSoonPage />
      </DocsLayout>
    );
  }
}

// https://nextjs.org/docs/app/api-reference/functions/generate-static-params
export const dynamicParams = false;
export const dynamic = "force-static";

export async function generateStaticParams() {
  const paths: Array<{ slug?: string[]; framework: Framework }> = [];

  for (const framework of frameworks) {
    for (const heading of docNavigationItems) {
      for (const item of heading?.items) {
        if (item.href && item.href.startsWith("/docs")) {
          const slug = item.href
            .replace("/docs", "")
            .split("/")
            .filter(Boolean);
          if (slug.length) {
            paths.push({
              slug,
              framework,
            });
          }
        }
      }
    }
  }

  return paths;
}
