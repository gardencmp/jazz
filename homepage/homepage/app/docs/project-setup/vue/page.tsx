import { TableOfContents } from "@/components/docs/TableOfContents";
import { clsx } from "clsx";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import VueGuide from "./vue.mdx";

const navItems = [
  {
    name: "Setup",
    href: "/docs/project-setup/vue#vue-setup",
  },
  {
    name: "Implement the Jazz Schema",
    href: "/docs/project-setup/vue#schema",
  },
  {
    name: "Subscribing to a CoValue",
    href: "/docs/project-setup/vue#subscribing",
  },
  {
    name: "Mutating a CoValue",
    href: "/docs/project-setup/vue#mutating",
  },
];
export default function Page() {
  return (
    <div
      className={clsx(
        "col-span-12 md:col-span-8 lg:col-span-9",
        "flex justify-center lg:gap-5",
      )}
    >
      <Prose className="overflow-x-hidden lg:flex-1">
        <VueGuide />
      </Prose>
      <TableOfContents className="w-48 shrink-0" items={navItems} />
    </div>
  );
}
