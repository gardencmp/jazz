import { TableOfContents } from "@/components/docs/TableOfContents";
import { clsx } from "clsx";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import ReactNativeGuide from "./react-native.mdx";

const navItems = [
  {
    name: "Setup",
    href: "/docs/project-setup/react#react-native-setup",
  },
  {
    name: "Using Jazz",
    href: "/docs/project-setup/react#react-native-using-jazz",
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
        <ReactNativeGuide />
      </Prose>
      <TableOfContents className="w-48 shrink-0" items={navItems} />
    </div>
  );
}
