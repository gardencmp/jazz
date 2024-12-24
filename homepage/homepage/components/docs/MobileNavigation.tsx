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

  return (
    <div className="md:hidden w-full border-b sticky top-0 z-10 bg-white">
      <div className="container px-0 flex justify-between text-stone-900 dark:text-white">
        <button
          type="button"
          className="py-3.5 px-3 inline-flex text-sm items-center gap-1"
          onClick={() => setActive("main")}
        >
          Menu <Icon size="xs" name="chevronRight" />
        </button>

        {tableOfContents && (
          <button
            type="button"
            className="py-3 px-4 mr-1"
            onClick={() => setActive("toc")}
          >
            <span className="sr-only">Table of contents</span>
            <Icon name="tableOfContents" size="sm" />
          </button>
        )}
      </div>

      <MobileNavigationDrawer
        from="left"
        isOpen={active === "main"}
        onClose={() => setActive(null)}
        title="Documentation"
      >
        <DocNav />
      </MobileNavigationDrawer>

      <MobileNavigationDrawer
        from="right"
        isOpen={active === "toc"}
        onClose={() => setActive(null)}
        title="Table of contents"
      >
        {tableOfContents && <TableOfContents items={tableOfContents} />}
      </MobileNavigationDrawer>
    </div>
  );
}
