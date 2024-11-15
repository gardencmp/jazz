import { clsx } from "clsx";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import type { Toc } from '@stefanprobst/rehype-extract-toc'
import { TableOfContents } from "@/components/docs/TableOfContents";

export default async function Page({params}: {params: {slug: string | string[]}}) {
  return (
    <>
      <Prose className="overflow-x-hidden lg:flex-1">
        <Content name={Array.isArray(params.slug) ? params.slug.join("/") : params.slug}/>
      </Prose>
      <ToC name={Array.isArray(params.slug) ? params.slug.join("/") : params.slug}/>
    </>
  );
}

async function Content({name}: {name: string}) {
  const Inner = (await import(`./${name}.mdx`)).default;
  return <Inner />;
}

async function ToC({name}: {name: string}) {
  const tableOfContents = (await import(`./${name}.mdx`)).tableOfContents as Toc
  return <TableOfContents items={tableOfContents} />;
}
