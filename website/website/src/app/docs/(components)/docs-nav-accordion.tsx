"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MdxDocNav } from "@/lib/mdx-types";
import clsx from "clsx";
import { usePathname } from "next/navigation";

const itemStyle = [
  "rounded-[8px] px-2 py-0 h-[32px]",
  "hover:bg-background-hover",
];
export const itemActiveStyle = [
  "hover:transition-colors",
  "bg-background-hover text-fill-contrast font-medium",
];

export function DocsNavAccordion({
  name,
  children,
  className,
}: {
  name: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AccordionItem value={name} className="space-y-1">
      <AccordionTrigger
        className={clsx(
          itemStyle,
          "data-[state=open]:text-fill-contrast data-[state=open]:font-medium",
          // className,
        )}
      >
        {name}
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}

export const docsNavListStyle = "space-y-[2px] pl-3 py-1";

export function DocsNavList({ docs }: { docs: MdxDocNav[] }) {
  const pathname = usePathname();
  return (
    <ul className={docsNavListStyle}>
      {docs.map((doc, index) => (
        <li
          key={index}
          className={clsx(
            itemStyle,
            pathname === `/docs/${doc.slug}` && itemActiveStyle,
            "flex items-center",
          )}
        >
          <DocNavLink href={`/docs/${doc.slug}`}>{doc.title}</DocNavLink>
        </li>
      ))}
    </ul>
  );
}

export function DocNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className={clsx("truncate grow")}>
      {children}
    </a>
  );
}
