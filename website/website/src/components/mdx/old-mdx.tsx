import { IframeHTMLAttributes, ReactNode } from "react";
import { ResponsiveIframe as ResponsiveIframeClient } from "./responsive-iframe";
import { HandIcon, MousePointer2Icon, TextCursorIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Prose(props: { children: ReactNode; className?: string }) {
  return (
    <article
      className={cn(
        "prose-stone dark:prose-invert",
        // headings
        // "prose-headings:font-display",
        // "prose-h1:text-title prose-h1:font-medium prose-h1:tracking-tighter",
        // "prose-h2:text-2xl lg:prose-h2:text-3xl prose-h2:font-medium prose-h2:tracking-tight",
        // text
        // "prose-p:max-w-3xl prose-p:leading-snug",
        // "prose-strong:font-medium",
        // code
        // "prose-code:font-normal prose-code:leading-tight prose-code:before:content-none prose-code:after:content-none prose-code:bg-stone-100 prose-code:dark:bg-stone-900 prose-code:p-1 prose-code:rounded",
        // pre
        "prose-pre:text-black dark:prose-pre:text-white prose-pre:max-w-3xl prose-pre:text-[0.8em] prose-pre:leading-[1.3] prose-pre:-mt-2 prose-pre:my-4 prose-pre:px-10 prose-pre:py-2 prose-pre:-mx-10 prose-pre:bg-transparent",
        // pre line
        "[&_pre_.line]:relative [&_pre_.line]:min-h-[1.3em] [&_pre_.lineNo]:text-[0.75em] [&_pre_.lineNo]:text-stone-300 [&_pre_.lineNo]:dark:text-stone-700 [&_pre_.lineNo]:absolute [&_pre_.lineNo]:text-right [&_pre_.lineNo]:w-8 [&_pre_.lineNo]:-left-10 [&_pre_.lineNo]:top-[0.3em] [&_pre_.lineNo]:select-none",
        props.className || "prose",
      )}
    >
      {props.children}
    </article>
  );
}

export function Slogan(props: { children: ReactNode; small?: boolean }) {
  return (
    <div
      className={cn(
        "Text-heading text-stone-700 dark:text-stone-500",
        // props.small
        //     ? "text-lg lg:text-xl -mt-2"
        //     : "text-3xl lg:text-4xl -mt-5",
      )}
    >
      {props.children}
    </div>
  );
}

export function Grid({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4",
        "mt-10 items-stretch",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function GridItem(props: { children: ReactNode; className?: string }) {
  return <div className={props.className || ""}>{props.children}</div>;
}

export function GridFeature(props: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "p-4 flex flex-col items-center justify-center gap-2",
        "not-prose text-base",
        "border border-stone-200 dark:border-stone-800 rounded-xl",
        props.className || "",
      ].join(" ")}
    >
      <div className="mr-2 text-stone-500">{props.icon}</div>
      <div className="text-stone-700 dark:text-stone-300">{props.children}</div>
    </div>
  );
}

export function GridCard(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        "col-span-2 p-4 [&>h4]:mt-0 [&>h3]:mt-0 [&>:last-child]:mb-0",
        "border border-stone-200 dark:border-stone-800 rounded-xl  shadow-sm",
        props.className,
      ].join(" ")}
    >
      {props.children}
    </div>
  );
}

export function MultiplayerIcon({
  color,
  strokeWidth,
  size,
}: {
  color?: string;
  strokeWidth?: number;
  size: number;
}) {
  return (
    <div className="relative z-0" style={{ width: size, height: size }}>
      <MousePointer2Icon
        size={0.6 * size}
        strokeWidth={(strokeWidth || 1) / 0.6}
        color={color}
        className="absolute top-0 right-0"
      />
      <MousePointer2Icon
        size={0.5 * size}
        strokeWidth={(strokeWidth || 1) / 0.5}
        color={color}
        className="absolute bottom-0 left-0 -scale-x-100"
      />
    </div>
  );
}

export function ComingSoonBadge({ when = "soon" }: { when?: string }) {
  return (
    <span className="bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-700 text-[0.6rem] px-1 py-0.5 rounded-xl align-text-top">
      Coming&nbsp;{when}
    </span>
  );
}

export function ResponsiveIframe(
  props: IframeHTMLAttributes<HTMLIFrameElement> & { localSrc: string },
) {
  return <ResponsiveIframeClient {...props} />;
}
