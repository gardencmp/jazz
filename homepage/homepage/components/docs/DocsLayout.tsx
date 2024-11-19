import { clsx } from "clsx";

export default function DocsLayout({
  children,
  nav,
}: {
  children: React.ReactNode;
  nav?: React.ReactNode;
}) {
  return (
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
      <div className="col-span-12 md:col-span-8 lg:col-span-9">{children}</div>
    </div>
  );
}
