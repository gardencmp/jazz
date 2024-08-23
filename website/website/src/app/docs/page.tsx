import { getMdxData } from "@/lib/mdx-server-utils";
import { notFound } from "next/navigation";
import path from "path";
import { DocsIndexPage as DocsIndexPageComponent } from "./(components)";

// We depend on /(content)/quickstart.mdx to exist for this page
const QUICKSTART_SLUG = "quickstart";
const docsDir = path.join(process.cwd(), "src/app/docs/(content)");

export const metadata = {
  title: "jazz - Docs",
  description: "Jazz Guide, FAQ & Docs.",
};

export default function DocsIndexPage() {
  const allDocs = getMdxData(docsDir);
  const quickstart = allDocs.find((doc) => doc.slug === QUICKSTART_SLUG);
  // console.log("allDocs", allDocs);
  // console.log("quickstart", quickstart);

  if (!quickstart) {
    notFound();
  }

  return <DocsIndexPageComponent quickstartDoc={quickstart} />;
}
