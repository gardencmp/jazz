import clsx from "clsx";
import { ReactNode } from "react";
import { H2, Kicker } from "../atoms/Headings";
import { Prose } from "./Prose";

function H2Sub({ children }: { children: React.ReactNode }) {
  return (
    <Prose size="lg" className="max-w-3xl">
      {children}
    </Prose>
  );
}

export function SectionHeader({
  kicker,
  title,
  slogan,
  className,
}: {
  title: ReactNode;
  kicker?: ReactNode;
  slogan?: ReactNode;
  className?: string;
}) {
  return (
    <hgroup className={clsx(className, "space-y-4 mb-5")}>
      {kicker && <Kicker>{kicker}</Kicker>}
      <H2>{title}</H2>
      {slogan && <H2Sub>{slogan}</H2Sub>}
    </hgroup>
  );
}
