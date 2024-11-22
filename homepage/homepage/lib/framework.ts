import { usePathname } from "next/navigation";

export enum Framework {
  React = "react",
  ReactNative = "react-native",
  Vue = "vue",
}

function isValidFramework(value: string): value is Framework {
  return Object.values(Framework).includes(value as Framework);
}

export const useFramework = () => {
  const pathname = usePathname();
  const framework = pathname.startsWith("/docs/")
    ? pathname.split("/")[2]
    : null;
  return framework && isValidFramework(framework) ? framework : Framework.React;
};
