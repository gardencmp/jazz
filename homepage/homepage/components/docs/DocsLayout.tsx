"use client";

import { MobileNavigation } from "@/components/docs/MobileNavigation";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { DocNav } from "@/components/docs/nav";
import { Toc } from "@stefanprobst/rehype-extract-toc";
import { clsx } from "clsx";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import { useState } from "react";

export function DocsLayout({
  children,
  nav,
  tableOfContents,
}: {
  children: React.ReactNode;
  nav?: React.ReactNode;
  tableOfContents?: Toc;
}) {
  return (
    <>
      <MobileNavigation tableOfContents={tableOfContents} />

      <div className="container relative grid grid-cols-12 gap-5">
        <div
          className={clsx(
            "py-8",
            "pr-3 md:col-span-4 lg:col-span-3",
            "sticky align-start top-[65px] h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden",
            "hidden md:block",
          )}
        >
          {nav}
        </div>
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          <div className=" flex justify-center gap-5">
            {children}
            {tableOfContents && (
              <TableOfContents
                className="text-sm pl-3 py-6 sticky align-start top-[65px] w-[16rem] h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden hidden lg:block"
                items={tableOfContents}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
