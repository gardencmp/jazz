import { Framework, isValidFramework } from "@/lib/framework";
import { usePathname } from "next/navigation";

export const useFramework = () => {
  const pathname = usePathname();
  const framework = pathname.startsWith("/docs/")
    ? pathname.split("/")[2]
    : null;
  return framework && isValidFramework(framework) ? framework : Framework.React;
};
