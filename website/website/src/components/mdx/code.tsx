import React from "react";
import { highlight } from "sugar-high";
import { ClipboardCopy } from "./index";
import clsx from "clsx";

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  children: string;
}

function Code({ children, ...props }: CodeProps) {
  let codeHTML = highlight(children);
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
}

interface PreProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  name: string;
  highlightLines?: number[];
}

function Pre({ children, name, highlightLines = [], ...props }: PreProps) {
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

  const highlightClasses = highlightLines
    .map((line) => `[&_code_.sh__line:nth-child(${line})]`)
    .join(",");

  return (
    <div
      className={clsx(
        "Pre relative bg-fill-contrast rounded-lg border !my-w6 overflow-hidden",
        `${highlightClasses}:bg-gray-100`,
      )}
      {...props}
    >
      <h4 className="h-[44px] flex items-center px-w4 font-medium text-canvas border-b border-white-a5 text-[0.8em] font-mono">
        {name}
      </h4>
      <div className="absolute top-2 right-2 z-10">
        <ClipboardCopy className="text-large">{textContent}</ClipboardCopy>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

export { Code, Pre };
