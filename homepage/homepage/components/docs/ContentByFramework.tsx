"use client";

import { FrameworkContext } from "@/context/FrameworkContext";
import { useContext } from "react";

export interface ContentByFrameworkProps {
  framework: string;
  children: React.ReactNode;
}

/**
 * Example:
 * <ContentByFramework framework="react">
 *   content visible only if React is the selected framework
 * </ContentByFramework>
 */

export function ContentByFramework(props: {
  framework: string;
  children: React.ReactNode;
}) {
  const framework = useContext(FrameworkContext);

  if (framework == props.framework) {
    return props.children;
  }
}
