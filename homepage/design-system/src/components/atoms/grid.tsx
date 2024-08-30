import { cva, cx, type VariantProps } from "class-variance-authority";

export const gridVariants = cva(["grid items-stretch"], {
  variants: {
    intent: {
      // hairline: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
      // gapped: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
      default: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
    },
    gap: {
      default: "gap-4",
      none: "gap-0",
      hairline: "gap-[1px]",
    },
  },
  defaultVariants: {
    intent: "default",
    gap: "default",
  },
});

export interface GridProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof gridVariants> {
  as?: React.ElementType;
}

export function Grid({ intent, gap, className, ...props }: GridProps) {
  return (
    <div
      className={cx(
        gridVariants({
          intent,
          gap,
          className,
        }),
      )}
    >
      {props.children}
    </div>
  );
}
