import clsx from "clsx";

type Props = {
  heading: string;
  subheading?: string;
  description: string | React.ReactNode;
  children: React.ReactNode;
};

export const PackagesSection = ({
  heading,
  subheading,
  description,
  children,
}: Props) => (
  <>
    <div className="grid grid-cols-12 gap-w6">
      <div className="col-span-full lg:col-span-6 ml-[-0.2em]">
        <h1 className="Text-subtitle text-fill-contrast !leading-[1.1]">
          {heading}
        </h1>
        <h2 className="Text-subtitle text-fill !leading-[1.1]">{subheading}</h2>
      </div>
      <div
        className={clsx(
          "col-span-full lg:col-span-8 text-base text-fill space-y-1",
        )}
      >
        {description}
      </div>
    </div>
    <div className="grid grid-cols-12 gap-w4 pt-1">{children}</div>
  </>
);
