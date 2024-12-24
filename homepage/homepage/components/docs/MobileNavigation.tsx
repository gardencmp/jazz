import { MobileNavigationDrawer } from "@/components/docs/MobileNavigationDrawer";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { DocNav } from "@/components/docs/nav";
import { Toc } from "@stefanprobst/rehype-extract-toc";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import { useState } from "react";

export function MobileNavigation({
  tableOfContents,
}: { tableOfContents?: Toc }) {
  const [active, setActive] = useState<"main" | "toc" | null>(null);

  console.log(tableOfContents);

  return (
    <div className="md:hidden w-full border-y sticky top-0 z-10 bg-white">
      <div className="container pl-0 pr-4 flex justify-between">
        <button
          type="button"
          className="p-3 inline-flex items-center gap-1"
          onClick={() => setActive("main")}
        >
          Menu <Icon size="sm" name="chevronRight" />
        </button>

        {tableOfContents && (
          <button
            type="button"
            className="p-3"
            onClick={() => setActive("toc")}
          >
            <span className="sr-only">On this page</span>
            <Icon name="tableOfContents" />
          </button>
        )}
      </div>

      <MobileNavigationDrawer
        from="left"
        isOpen={active === "main"}
        onClose={() => setActive(null)}
      >
        <DocNav />
      </MobileNavigationDrawer>

      <MobileNavigationDrawer
        from="right"
        isOpen={active === "toc"}
        onClose={() => setActive(null)}
      >
        {tableOfContents && <TableOfContents items={tableOfContents} />}
      </MobileNavigationDrawer>
    </div>
  );
}
