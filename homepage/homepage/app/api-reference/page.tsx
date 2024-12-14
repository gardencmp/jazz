import { packages } from "@/lib/packages";
import { clsx } from "clsx";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import Link from "next/link";

const CardHeading = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h2
      className={clsx(
        className,
        "font-medium text-stone-950 dark:text-white text-lg transition-colors",
      )}
    >
      {children}
    </h2>
  );
};

const CardBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <p className={clsx(className, "text-sm")}>{children}</p>;
};

const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={clsx(
        className,
        "not-prose p-4 h-full rounded-xl flex flex-col gap-1.5 group lg:p-5",
      )}
    >
      {children}
    </div>
  );
};

export default function Page() {
  return (
    <>
      <h1>API Reference</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map(({ name, description }) => (
          <Link
            className="not-prose block"
            href={`/api-reference/${name}`}
            key={name}
          >
            <Card className="border shadow-sm">
              <Icon
                name="package"
                className="text-stone-500 dark:text-stone-400"
              />
              <CardHeading className="group-hover:text-blue dark:group-hover:text-blue-600">
                {name}
              </CardHeading>
              <CardBody>{description}</CardBody>
            </Card>
          </Link>
        ))}

        <Card className="bg-stone-50 dark:bg-stone-925">
          <Icon
            name="help"
            size="md"
            className="text-stone-500 dark:text-stone-400"
          />
          <CardHeading>
            Can&apos;t find what you&apos;re looking for?
          </CardHeading>
          <CardBody>
            Get help from our{" "}
            <Link href="https://discord.gg/utDMjHYg42" className="underline">
              Discord
            </Link>
            , or open an issue on{" "}
            <Link
              href="https://github.com/garden-co/jazz"
              className="underline"
            >
              GitHub
            </Link>
            .
          </CardBody>
        </Card>
      </div>
    </>
  );
}
