import { cx } from "class-variance-authority";
import { ReactNode } from "react";
import { Text, Grid } from "@atoms";

// Because this is just the default Grid with a Text heading,
// I'd rename it GridWithHeading
export function GridGapped({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <Grid className={cx(className)}>
      {title && (
        // <h2
        //   className={clsx(
        //     "col-span-full",
        //     "font-display",
        //     "text-2xl",
        //     "font-semibold",
        //     "tracking-tight",
        //   )}
        // >
        //   {title}
        //       </h2>
        <Text as="h2" intent="title" size="subheading">
          {title}
        </Text>
      )}
      {children}
    </Grid>
  );
}
