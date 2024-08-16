"use client";

import React, { useState } from "react";
import { CopyIcon, CheckIcon } from "@radix-ui/react-icons";
import clsx from "clsx";

export const ClipboardCopy = ({
  children,
  className,
}: {
  children: React.ReactNode | string;
  className?: string;
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      if (typeof children === "string") {
        await navigator.clipboard.writeText(children);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      } else {
        console.error("Cannot copy non-string content");
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={copyToClipboard}
      aria-label="Copy code"
      className={clsx(
        "p-1.5 rounded text-line",
        "hover:bg-white-a3",
        "focus:outline-none focus:ring-2 focus:ring-white-a3",
        className,
      )}
    >
      {isCopied ? (
        <CheckIcon className="size-em text-accent" />
      ) : (
        <CopyIcon className="size-em" />
      )}
    </button>
  );
};
