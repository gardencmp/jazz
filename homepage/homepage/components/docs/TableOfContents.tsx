import type { Toc, TocEntry } from "@stefanprobst/rehype-extract-toc";
import { clsx } from "clsx";
import Link from "next/link";

const TocList = ({ items, level }: { items: TocEntry[]; level: number }) => {
  return (
    <ul className="space-y-3" style={{ paddingLeft: `${level * 0.75}rem` }}>
      {items.map((item) => (
        <li key={item.id} className="space-y-3">
          <Link href={`#${item.id}`}>{item.value}</Link>
          {item.children && <TocList items={item.children} level={level + 1} />}
        </li>
      ))}
    </ul>
  );
};

export function TableOfContents({
  title,
  className,
  items,
}: {
  title?: string;
  items: Toc;
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <div className={className}>
      <p className="font-medium text-stone-900 dark:text-white mb-3">{title}</p>
      <TocList items={items} level={0} />
    </div>
  );
}
