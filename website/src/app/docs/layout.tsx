import { Metadata } from "next";
import { DocsNav, DocsNavList } from "@/components/nav";
import { getDocsList } from "@/lib/mdx-utils";

import clsx from "clsx";

export const metadata: Metadata = {
  title: "jazz - Docs",
  description: "Jazz Guide, FAQ & Docs.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docsList = getDocsList();

  return (
    // max-w-fit = 1292px
    <div className={clsx("relative container max-w-[1292px] md:flex")}>
      <div
        className={clsx(
          // fixed aside; requires pl-* on the parent
          // "fixed top-0 left-0 bottom-0",
          // "flex flex-col overflow-hidden",
          // "w-[280px] border-r z-10",
          "sticky top-under-nav",
          "h-[calc(100vh-var(--space-under-nav))] w-[250px]",
          "hidden md:flex md:shrink-0 md:flex-col md:justify-between",
        )}
      >
        <div className="relative overflow-hidden">
          <div
            className={clsx(
              "flex flex-col h-[calc(100vh-200px)] ",
              "overflow-y-scroll pb-4 pr-2",
              "styled-scrollbar",
              "text-small",
            )}
          >
            <DocsNav guideDocs={<DocsNavList docs={docsList} />}></DocsNav>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
