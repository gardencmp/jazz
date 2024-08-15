"use client";

import { ReactNode } from "react";
// import { NavCommentPackage } from "./nav-comment-package";
import { Accordion } from "@/components/ui/accordion";
import clsx from "clsx";
import {
  DocsNavAccordion,
  itemActiveStyle,
  docsNavListStyle,
} from "./docs-nav-accordion";
import { useState } from "react";

export function DocsNav({ guideDocs }: { guideDocs: ReactNode }) {
  const [openItem, setOpenItem] = useState("Guides");

  // TODO: open at /<mdx-grup> based on matching pathname

  return (
    <>
      <Accordion
        type="single"
        defaultValue={openItem}
        onValueChange={setOpenItem}
        collapsible
      >
        <DocsNavAccordion name="Guides" className={clsx(itemActiveStyle)}>
          {guideDocs}
        </DocsNavAccordion>

        <DocsNavAccordion name="Recipes">
          <div className={docsNavListStyle}>Coming soon…</div>
        </DocsNavAccordion>
        <DocsNavAccordion name="API">
          <div className={docsNavListStyle}>Coming soon…</div>
        </DocsNavAccordion>
      </Accordion>

      {/* <NavCommentPackage package="jazz-tools" />
      <NavCommentPackage package="jazz-react" />
      <NavCommentPackage package="jazz-browser" />
      <NavCommentPackage package="jazz-browser-media-images" />
      <NavCommentPackage package="jazz-nodejs" /> */}
    </>
  );
}
