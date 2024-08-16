"use client";

import { useState, useEffect } from "react";
import { DocMap } from "./doc-map";
import { MdxHeading } from "@/lib/mdx-types";

interface ScrollHandlerProps {
  headings: MdxHeading[];
}

export function DocMapScroller({ headings }: ScrollHandlerProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <DocMap headings={headings} scrollPosition={scrollPosition} />;
}
