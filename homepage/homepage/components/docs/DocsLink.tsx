"use client";

import { isValidFramework } from "@/lib/framework";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnchorHTMLAttributes, DetailedHTMLProps } from "react";

export function DocsLink(
  props: DetailedHTMLProps<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >,
) {
  if (!props.href) {
    return props.children;
  }

  const framework = usePathname().split("/")[2];
  const hasFramework = isValidFramework(props.href.split("/")[2]);
  const isExternal = props.href.startsWith("http");

  return (
    <Link
      href={
        hasFramework || isExternal
          ? props.href
          : props.href.replace("/docs", "/docs/" + framework)
      }
    >
      {props.children}
    </Link>
  );
}
