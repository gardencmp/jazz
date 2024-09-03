import { ReactNode } from "react";
import { H1 } from "../atoms/Headings";
import clsx from "clsx";

function H1Sub({ children }: { children: React.ReactNode }) {
  return (
    <p
      className={clsx(
        "text-3xl lg:text-4xl",
        "leading-snug",
        "tracking-tight",
        "mb-5",
        "max-w-4xl",
        // "text-stone-700 dark:text-stone-500"
        "text-solid"
      )}
    >
      {children}
    </p>
  );
}

export function HeroHeader({
  title,
  slogan,
}: {
  title: ReactNode;
  slogan: ReactNode;
}) {
  return (
    <hgroup className="mb-10 md:pt-20">
      <H1>{title}</H1>
      <H1Sub>{slogan}</H1Sub>
    </hgroup>
  );
}
