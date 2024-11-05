import { TableOfContents } from "@/components/docs/TableOfContents";
import { clsx } from "clsx";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import CoValuesGuide from "./covalues.mdx";

const navItems = [
  {
    name: "CoValues",
    href: "/docs/schemas/covalues",
  },
  {
    name: "Schemas as Your App's First Step",
    href: "/docs/schemas/covalues#schemas-as-first-step",
  },
  {
    name: "CoValue field types",
    href: "/docs/schemas/covalues#field-types",
    items: [
      {
        name: "Primitive Fields",
        href: "/docs/schemas/covalues#primitive-fields",
      },
      {
        name: "Refs",
        href: "/docs/schemas/covalues#refs",
      },
      {
        name: "Computed Fields, Methods & Constructors ",
        href: "/docs/schemas/covalues#custom-fields",
      },
    ],
  },
  {
    name: "CoMaps",
    href: "/docs/schemas/covalues#comaps",
    items: [
      {
        name: "Struct-like CoMaps",
        href: "/docs/schemas/covalues#comaps-struct-like",
      },
      {
        name: "Dict/Record-like CoMaps",
        href: "/docs/schemas/covalues#comaps-dict-like",
      },
    ],
  },
  {
    name: "CoLists",
    href: "/docs/schemas/covalues#colists",
  },
  {
    name: "CoStreams",
    href: "/docs/schemas/covalues#costreams",
  },
  {
    name: "BinaryCoStreams",
    href: "/docs/schemas/covalues#binarycostreams",
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
        <CoValuesGuide />
      </Prose>
      <TableOfContents className="w-48 shrink-0" items={navItems} />
    </div>
  );
}
