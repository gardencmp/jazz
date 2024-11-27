import clsx from "clsx";
import { ReactNode } from "react";
import { Card } from "../atoms/Card";

export function GridCard(props: { children: ReactNode; className?: string }) {
  return (
    <Card
      className={clsx(
        "col-span-2 p-4 [&>h4]:mt-0 [&>h3]:mt-0 [&>:last-child]:mb-0",
        props.className,
      )}
    >
      {props.children}
    </Card>
  );
}
