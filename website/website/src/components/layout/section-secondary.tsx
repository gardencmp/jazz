import clsx from "clsx";

export const SectionSecondary = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className="space-y-w4">
    <SectionHeadingSecondary>{title}</SectionHeadingSecondary>
    <div className={clsx("grid grid-cols-12", className)}>
      {children}
      {/* <div className="flex flex-col gap-inset h-[420px] border rounded-lg">
        <h2 className="Text-heading !text-solid mt-auto p-w4">
          More coming soon…
        </h2>
      </div> */}
    </div>
  </div>
);

export const SectionHeadingSecondary = ({
  children,
}: {
  children: string | React.ReactNode;
}) => (
  <div className="space-y-2">
    <h1 className="Text-meta text-fill-contrast leading-none">{children}</h1>
    <hr className="border-lin" />
  </div>
);
