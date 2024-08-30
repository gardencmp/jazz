import clsx from "clsx";
import { ReactNode } from "react";
import { Text } from "@atoms";

export function HeaderSection({
  title,
  slogan,
  className = "space-y-1",
}: {
  title: ReactNode;
  slogan: ReactNode;
  className?: string;
}) {
  return (
    // "mb-5"
    <section className={className}>
      {/* <h2
          className={clsx(
            "font-display",
            "text-2xl",
            "mb-2",
            "font-semibold",
            "tracking-tight",
          )}
        >
          {title}
        </h2>
        <h3
          className={clsx(
            "text-lg lg:text-xl",
            "leading-snug",
            "tracking-tight",
            "max-w-4xl",
            "text-stone-700 dark:text-stone-500",
          )}
        >
          {slogan}
        </h3> */}
      <Text as="h2" intent="title" size="subheading">
        {title}
      </Text>
      <Text as="h3" intent="title" size="xlarge" color="solid">
        {slogan}
      </Text>
    </section>
  );
}
