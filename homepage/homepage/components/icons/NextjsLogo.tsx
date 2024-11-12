import { SiNextdotjs } from "@icons-pack/react-simple-icons";
import { clsx } from "clsx";

export function NextjsLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <SiNextdotjs
      {...props}
      className={clsx(props.className, "fill-black dark:fill-white")}
    />
  );
}
