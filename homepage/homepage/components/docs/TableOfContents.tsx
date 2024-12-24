import type { Toc, TocEntry } from "@stefanprobst/rehype-extract-toc";
import { clsx } from "clsx";
import Link from "next/link";

const TocList = ({ items }: { items: TocEntry[] }) => {
  return (
    <ul className="list-disc pl-4 space-y-2">
      {items.map((item) => (
        <li key={item.id} className="space-y-2">
          <Link href={`#${item.id}`}>{item.value}</Link>
          {item.children && <TocList items={item.children} />}
        </li>
      ))}
    </ul>
  );
};

export function TableOfContents({
  className,
  items,
}: {
  items: Toc;
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <div className={className}>
      <p className="mb-3">On this page:</p>
      <TocList items={items} />
    </div>
  );
}
