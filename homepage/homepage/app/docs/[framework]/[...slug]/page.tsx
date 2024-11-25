import { TableOfContents } from "@/components/docs/TableOfContents";
import { docNavigationItems } from "@/lib/docNavigationItems";
import { Framework, frameworks, isValidFramework } from "@/lib/framework";
import type { Toc } from "@stefanprobst/rehype-extract-toc";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";

function Error({ slugPath }: { slugPath: string }) {
  return (
    <Prose className="overflow-x-hidden lg:flex-1">
      <h3>Error loading page: {slugPath}</h3>
    </Prose>
  );
}

export default async function Page({
  params: { slug, framework },
}: { params: { slug: string[]; framework: string } }) {
  const slugPath = slug.join("/");

  // if the route ends in a framework name, return 404
  // because we want the framework name to be in /docs/[framework]/[...slug]
  if (isValidFramework(slug[slug.length - 1]))
    return <Error slugPath={slugPath} />;

  try {
    let mdxSource;
    try {
      mdxSource = await import(`./${slugPath}.mdx`);
    } catch (error) {
      console.log("Error loading MDX file:" + slugPath, error);
      mdxSource = await import(`./${slugPath}/${framework}.mdx`);
    }

    const { default: Content, tableOfContents } = mdxSource;

    return (
      <>
        <Prose className="overflow-x-hidden lg:flex-1  py-8">
          <Content />
        </Prose>
        {tableOfContents && <TableOfContents items={tableOfContents as Toc} />}
      </>
    );
  } catch (error) {
    console.error("Error loading MDX file:" + slugPath, error);
    return <Error slugPath={slugPath} />;
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
        if (item.href && item.href.startsWith("/docs") && item.done) {
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

  console.log(paths);

  return paths;
}
