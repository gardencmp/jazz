import clsx from "clsx";

// small?: boolean;
export const Slogan = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={clsx(
        "Text-heading text-stone-700 dark:text-stone-500",
        // props.small
        //     ? "text-lg lg:text-xl -mt-2"
        //     : "text-3xl lg:text-4xl -mt-5",
      )}
    >
      {children}
    </div>
  );
};
