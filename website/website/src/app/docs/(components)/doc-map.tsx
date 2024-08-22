"use client";

import { MdxHeading } from "@/lib/mdx-types";
import { cn } from "@/lib/utils";
import { BookmarkIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ArticleMapProps {
  headings: MdxHeading[];
  scrollPosition: number;
}

export const DocMap = ({ headings, scrollPosition }: ArticleMapProps) => {
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const ulRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const determineActiveHeading = () => {
      for (let i = headings.length - 1; i >= 0; i--) {
        const element = document.getElementById(
          headings[i].anchorLink.slice(1),
        );
        if (element && element.offsetTop <= scrollPosition + 100) {
          setActiveHeading(headings[i].anchorLink.slice(1));
          break;
        }
      }
    };

    determineActiveHeading();
  }, [scrollPosition, headings]);

  return (
    <aside
      className={cn(
        "ArticleMap hidden min-[1320px]:block",
        "sticky top-under-nav-nudge w-[250px]",
        "h-max max-h-[calc(100vh-var(--space-under-nav-nudge))]",
      )}
    >
      <div className="space-y-3 text-small">
        <div className="flex items-center gap-1.5 font-medium text-fill-contrast -ml-[2px]">
          <BookmarkIcon className="size-em transform translate-y-[-0.1em]" />
          On this page
        </div>
        <ul
          ref={ulRef}
          className={cn(
            "pl-4 border-l-2 border-transparent relative space-y-2",
            // vars
            // "[--top:0] [--height:24px]",
            // before
            "before:absolute before:top-0 before:left-[-2px] before:w-[2px] before:rounded-full before:content-[''] before:bg-background-active before:h-full",
            // after
            "after:absolute after:top-0 after:left-[-2px] after:w-[2px] after:rounded-full after:content-[''] after:bg-fill after:h-[var(--height,24px)] after:transition-all after:transform after:translate-y-[var(--translate-y,0)]",
            "after:transition-all after:duration-300 after:ease-in-out",
          )}
        >
          {headings.map((heading, index) => (
            <li
              key={index}
              data-level={heading.level === "h2" ? "2" : "3"}
              className={cn(
                heading.level === "h3" ? "ml-3" : "",
                activeHeading === heading.anchorLink.slice(1)
                  ? "text-fill-contrast"
                  : "",
              )}
            >
              <a href={heading.anchorLink}>
                <span>{heading.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
