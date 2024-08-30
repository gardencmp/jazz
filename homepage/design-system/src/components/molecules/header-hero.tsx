import clsx from "clsx";
import { ReactNode } from "react";
import { Text } from "@atoms";

export function HeaderHero({
  title,
  slogan,
  className = "space-y-2",
}: {
  title: ReactNode;
  slogan: ReactNode;
  className?: string;
}) {
  return (
    // remove "mb-10 md:pt-20" from header because to do so reduces our ability to compose the header for variations. Only when we know can we assign this class definitively.
    <header className={className}>
      {/* <h1
        className={clsx(
          "font-display",
          "text-5xl lg:text-6xl",
          "mb-3",
          "font-medium",
          "tracking-tighter",
        )}
      >
        {title}
      </h1> */}
      {/* <h2
        className={clsx(
          "text-3xl lg:text-4xl",
          "leading-snug",
          "tracking-tight",
          "mb-5",
          "max-w-4xl",
          "text-stone-700 dark:text-stone-500",
        )}
      >
        {slogan}
      </h2> */}
      <Text as="h1" intent="display" size="super">
        {title}
      </Text>
      <Text as="h2" intent="display" size="title" color="solid">
        {slogan}
      </Text>
    </header>
  );
}
