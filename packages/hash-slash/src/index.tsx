import { ReactNode, useEffect, useState } from "react";

export type Routes = {
  [Key: `/${string}`]: ReactNode | ((param: string) => ReactNode);
};

export function HashRoute(
  routes: Routes,
  { reportToParentFrame }: { reportToParentFrame?: boolean } = {}
): ReactNode {
  const [hash, setHash] = useState(location.hash.slice(1));

  useEffect(() => {
    const onHashChange = () => {
      setHash(location.hash.slice(1));
      reportToParentFrame &&
        window.parent.postMessage(
          {
            type: "navigate",
            url: location.href,
          },
          "*"
        );
      console.log("Posting", location.href + "-navigate");
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  });

  for (const route of Object.keys(routes)) {
    if (hash === route || (hash === "" && route === "/")) {
      const elem = routes[route as keyof Routes];
      if (typeof elem === "function") {
        return null;
      } else {
        return elem;
      }
    } else if (route.includes("/:")) {
      const [prefix] = route.split(":");

      if (!prefix || hash.startsWith(prefix)) {
        const handler = routes[route as keyof Routes];
        if (typeof handler === "function") {
          return handler(hash.slice(prefix?.length || 0));
        } else {
          return "No route found for " + hash;
        }
      }
    }
  }
}
