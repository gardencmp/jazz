import { ReactNode, useEffect, useState } from "react";

export type Routes = {
  [Key: `/${string}`]: ReactNode | ((param: string) => ReactNode);
};

export function useHashRouter(options?: { tellParentFrame?: boolean }) {
  const [hash, setHash] = useState(location.hash.slice(1));

  useEffect(() => {
    const onHashChange = () => {
      setHash(location.hash.slice(1));
      options?.tellParentFrame &&
        window.parent.postMessage(
          {
            type: "navigate",
            url: location.href,
          },
          "*",
        );
      console.log("Posting", location.href + "-navigate");
    };

    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  });

  return {
    navigate: (url: string) => {
      history.replaceState({}, "", url);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    },
    route: function (routes: {
      [route: `${string}` | `/${string}/:${string}`]: (
        param: string,
      ) => ReactNode;
    }) {
      for (const [route, paramUser] of Object.entries(routes)) {
        if (route.includes(":")) {
          const [routePath, _paramName] = route.split(":");
          if (routePath && hash.startsWith(routePath)) {
            const param = hash.split(routePath!)[1];
            return paramUser(param!);
          }
        } else {
          if (hash === route || (route === "/" && hash === "")) {
            return paramUser("");
          }
        }
      }
      return null;
    },
  };
}

export function useIframeHashRouter() {
  return useHashRouter({ tellParentFrame: true });
}
