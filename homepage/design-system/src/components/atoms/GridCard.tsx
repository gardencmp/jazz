import clsx from "clsx";
import { ReactNode } from "react";

export const GridCard = (props: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      // [&>h4]:mt-0 [&>h3]:mt-0 [&>:last-child]:mb-0
      // By default, typography should have no whitespace. I always hoist whitespace settings tot he parent using either gap or space-* classes. This is b/c whitespace is used in composition of layouts, it's not specifically part of typography. This means we don't need to write these difficult to maintain classes (above) for every component.

      // border-stone-200 dark:border-stone-800
      // By setting a default boreder colour that automatically adapts to the dark mode theme, we can remove the need to set a border colour on every component.

      // col-span-2
      // This means that this component has a dependency: a flex parent. Better to compose this style on the parent, possibly using [&_.GridCard]:*
      className={clsx(
        "GridCard p-4 border rounded-xl shadow-sm",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};
