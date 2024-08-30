import { cx } from "class-variance-authority";
import { Grid } from "@atoms";

// "Hairline" feels like a style, like it should extend a base Grid component with css?
export function GridHairline({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Grid
      gap="hairline"
      className={cx(
        // "mb-10" — hoist to parent
        // "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
        // "gap-[1px] items-stretch",

        // this prohibits extensive reuse, I think it should be applied when composing via the classname prop.
        // "-mx-6",
        "rounded-xl overflow-hidden bg-canvas",
        "[&>*]:rounded-none [&>*]:border-none",
        // "[&>*]:bg-stone-100 [&>*]:dark:bg-stone-900" — replace with pre-themed colors that handle dark mode at root level
        "[&>*]:bg-background",
        className,
      )}
    >
      {children}
    </Grid>
  );
}
