"use client";

import { Accordion } from "@/components/ui/accordion";
import { MdxDocNav } from "@/lib/mdx-types";
import clsx from "clsx";
import { useState } from "react";
import {
  DocsNavAccordion,
  DocsNavList,
  docsNavListStyle,
  itemActiveStyle,
} from "./docs-nav-accordion";

export function DocsNav({
  docs,
  currentPath,
}: {
  docs: MdxDocNav[];
  currentPath: string;
}) {
  const [openItem, setOpenItem] = useState(currentPath);

  const guidesDocsList = docs.filter((doc) => doc.kind === "guides");
  const apiDocsList = docs.filter((doc) => doc.kind === "api");

  // TODO: open at /<mdx-grup> based on matching pathname

  return (
    <div
      className={clsx(
        "sticky top-under-nav",
        "h-[calc(100vh-var(--space-under-nav))] w-[220px]",
        "hidden md:flex md:shrink-0 md:flex-col md:justify-between",
      )}
    >
      <div className="relative overflow-hidden">
        <div
          className={clsx(
            "flex flex-col h-[calc(100vh-200px)]",
            "overflow-y-scroll pb-4 pr-2",
            "styled-scrollbar text-small",
          )}
        >
          <Accordion
            type="single"
            defaultValue={openItem}
            onValueChange={setOpenItem}
            collapsible
          >
            <DocsNavAccordion name="Guides" className={clsx(itemActiveStyle)}>
              <DocsNavList docs={guidesDocsList} kind="guides" />
            </DocsNavAccordion>
            <DocsNavAccordion name="API" className={clsx(itemActiveStyle)}>
              <DocsNavList docs={apiDocsList} kind="api" />
            </DocsNavAccordion>
            <DocsNavAccordion name="Recipes">
              <div className={docsNavListStyle}>Coming soon…</div>
            </DocsNavAccordion>
          </Accordion>

          {/* <NavCommentPackage package="jazz-tools" />
            <NavCommentPackage package="jazz-react" />
            <NavCommentPackage package="jazz-browser" />
            <NavCommentPackage package="jazz-browser-media-images" />
            <NavCommentPackage package="jazz-nodejs" /> */}
        </div>
      </div>
    </div>
  );
}
