"use client";

import { clsx } from "clsx";
import { usePagefindSearch } from "../pagefind";
import { QuickSearch } from "../quick-search";

export default function DocsLayout({
  children,
  nav,
}: {
  children: React.ReactNode;
  nav?: React.ReactNode;
}) {
  const { setOpen } = usePagefindSearch();
  return (
    <div className="container relative grid grid-cols-12 gap-5">
      <div
        className={clsx(
          "py-8",
          "pr-3 md:col-span-4 lg:col-span-3",
          "sticky align-start top-[65px] h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden",
          "hidden md:block",
        )}
        data-pagefind-ignore
      >
        <div className="pb-5">
          <QuickSearch onClick={() => setOpen((open) => !open)} />
        </div>
        {nav}
      </div>
      <div className="col-span-12 md:col-span-8 lg:col-span-9 data-pagefind-body">
        {children}
      </div>
    </div>
  );
}
