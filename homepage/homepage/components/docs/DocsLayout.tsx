import { TableOfContents } from "@/components/docs/TableOfContents";
import { DocNav } from "@/components/docs/nav";
import { Toc } from "@stefanprobst/rehype-extract-toc";
import { clsx } from "clsx";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";

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
      <div className="md:hidden w-full border-y sticky top-0 z-10 bg-white">
        <div className="container pl-0 pr-4  flex justify-between">
          <button type="button" className="p-3 inline-flex items-center gap-1">
            Menu <Icon size="sm" name="chevronRight" />
          </button>

          <button type="button" className="p-3">
            <span className="sr-only">On this page</span>
            <Icon name="tableOfContents" />
          </button>
        </div>
      </div>

      <div className="container relative grid grid-cols-12 gap-5">
        <div
          className={clsx(
            "py-8",
            "pr-3 md:col-span-4 lg:col-span-3",
            "sticky align-start top-[65px] h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden",
            "hidden md:block",
          )}
        >
          <DocNav />
        </div>
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          <div className=" flex justify-center gap-5">
            {children}
            {tableOfContents && <TableOfContents items={tableOfContents} />}
          </div>
        </div>
      </div>
    </>
  );
}
