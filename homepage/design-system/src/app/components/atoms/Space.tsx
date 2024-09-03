import { cva, cx, type VariantProps } from "class-variance-authority";

/* 
  Space helps you group related elements by whitespace, both vertically and horizontally. Use it to create layouts with whitespace.
 */

export const spaceVariants = cva([""], {
  variants: {
    vertical: {
      minor: "space-y-d8",
      major: "space-y-d16",
      super: "space-y-d24",
    },
    container: {
      true: "container",
    },
  },
  compoundVariants: [
    // EXAMPLE:
    // {
    //   intent: "display",
    //   size: ["super", "title", "subtitle"],
    //   class: "text-super tracking-super",
    // },
  ],
  defaultVariants: {
    // vertical: "default",
    container: true,
  },
});

export interface SpaceProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof spaceVariants> {
  as?: React.ElementType;
}

export function GroupWithSpace({
  as: Component = "div",
  vertical,
  className,
  ...props
}: SpaceProps) {
  return (
    <Component
      {...props}
      className={cx(
        spaceVariants({
          vertical,
          className,
        })
      )}
    >
      {props.children}
    </Component>
  );
}
