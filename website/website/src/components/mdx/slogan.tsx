import { cn } from "@/lib/utils";

export function Slogan(props: { children: React.ReactNode; small?: boolean }) {
  return (
    <div
      className={cn(
        "Text-heading text-stone-700 dark:text-stone-500",
        // props.small
        //     ? "text-lg lg:text-xl -mt-2"
        //     : "text-3xl lg:text-4xl -mt-5",
      )}
    >
      {props.children}
    </div>
  );
}
