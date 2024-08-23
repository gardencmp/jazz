import React, { useId, ReactNode } from "react";
import { ClipboardCopy, Code } from "./index";
import clsx from "clsx";

/* housing the <Code> component in here breaks the build. 🤷🏻 */

interface PreProps extends React.HTMLAttributes<HTMLPreElement> {
  children: ReactNode;
  showCopyAction?: boolean;
}

export const Pre = ({
  children,
  showCopyAction = true,
  ...props
}: PreProps) => {
  const textContent = React.Children.toArray(children)
    .filter(
      (child) =>
        React.isValidElement(child) &&
        (child.type === Code || child.type === "code"),
    )
    .map((child) => {
      if (
        React.isValidElement(child) &&
        typeof child.props.children === "string"
      ) {
        return child.props.children;
      }
      return "";
    })
    .join("");

  return (
    <>
      {showCopyAction && (
        <div className="absolute top-2 right-2 z-10">
          <ClipboardCopy className="text-large">{textContent}</ClipboardCopy>
        </div>
      )}
      <pre {...props}>{children}</pre>
    </>
  );
};

export interface FileProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode | string;
  name?: string;
  highlightLines?: number[];
  theme?: "light" | "dark";
  className?: string;
}

/* 
  Using this "changed lines" highlighting method: 
  https://github.com/huozhi/sugar-high?tab=readme-ov-file#line-highlight 
 */
export const File = ({
  children,
  name,
  highlightLines = [],
  theme = "dark",
  className,
  ...props
}: FileProps) => {
  const uniqueId = useId();
  return (
    <div
      data-file-id={uniqueId}
      className={clsx(
        "File relative rounded-lg border !my-w6",
        theme === "dark" ? "bg-fill-contrast" : "bg-background",
        className,
      )}
      {...props}
    >
      <style>
        {highlightLines
          .map(
            (line) =>
              `[data-file-id="${uniqueId}"] .sh__line:nth-child(${line}) {
            background-color: var(--code-line-highlight);
            border-color: var(--code-line-marker);
          }`,
          )
          .join("\n")}
      </style>
      {name && (
        <div className="h-[44px] flex items-center px-w4 font-mediu text-canvas border-b border-white-a5 text-[0.8em] font-mono">
          {name}
        </div>
      )}
      {children}
    </div>
  );
};
