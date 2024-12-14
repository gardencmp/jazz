"use client";

import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../atoms/Icon";

// TODO: add tabs feature, and remove CodeExampleTabs

function CopyButton({ code, size }: { code: string; size?: "sm" | "md" }) {
  let [copyCount, setCopyCount] = useState(0);
  let copied = copyCount > 0;

  useEffect(() => {
    if (copyCount > 0) {
      let timeout = setTimeout(() => setCopyCount(0), 1000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [copyCount]);

  return (
    <button
      type="button"
      className={clsx(
        "group/button absolute overflow-hidden rounded text-2xs font-medium opacity-0 backdrop-blur transition focus:opacity-100 group-hover:opacity-100",
        copied
          ? "bg-emerald-400/10 ring-1 ring-inset ring-emerald-400/20"
          : "bg-white/5 hover:bg-white/7.5 dark:bg-white/2.5 dark:hover:bg-white/5",
        size == "sm"
          ? "right-1.5 top-1.5 py-[2px] pl-1 pr-2"
          : "right-2 top-2 py-1 pl-2 pr-3 ",
      )}
      onClick={() => {
        window.navigator.clipboard.writeText(code).then(() => {
          setCopyCount((count) => count + 1);
        });
      }}
    >
      <span
        aria-hidden={copied}
        className={clsx(
          "pointer-events-none flex items-center gap-1 text-stone-500 dark:text-stone-400 transition duration-300 group-hover/button:text-stone-600 dark:group-hover/button:text-stone-300",
          copied && "-translate-y-1.5 opacity-0",
        )}
      >
        <Icon
          name="copy"
          size="xs"
          className={clsx(
            size === "sm" ? "size-2" : "size-3",
            "stroke-stone-500 transition-colors group-hover/button:stroke-stone-600 dark:group-hover/button:stroke-stone-400",
          )}
        />
        Copy
      </span>
      <span
        aria-hidden={!copied}
        className={clsx(
          "pointer-events-none absolute inset-0 flex items-center justify-center text-emerald-600 transition duration-300 dark:text-emerald-400",
          !copied && "translate-y-1.5 opacity-0",
        )}
      >
        Copied!
      </span>
    </button>
  );
}

export function CodeGroup({
  children,
  size,
  className,
}: {
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  const textRef = useRef<HTMLPreElement | null>(null);
  const [code, setCode] = useState<string>();

  useEffect(() => {
    if (textRef.current) {
      setCode(textRef.current.innerText);
    }
  }, [children]);

  return (
    <div className={clsx(className, "group relative")}>
      <pre
        className={clsx(
          "h-full border p-0 bg-stone-50 dark:bg-stone-900",
          "text-black dark:text-white",
          {
            "text-sm": size === "sm",
          },
        )}
        ref={textRef}
      >
        {children}
      </pre>

      {code ? <CopyButton size={size} code={code} /> : <></>}
    </div>
  );
}
