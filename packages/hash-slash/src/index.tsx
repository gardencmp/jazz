import { ReactNode, useEffect, useState } from "react";

export type Routes = {
    [Key: `/${string}`]: ReactNode | ((param: string) => ReactNode);
};

export function useHash(options?: {tellParentFrame?: boolean}) {
    const [hash, setHash] = useState(location.hash.slice(1));

    useEffect(() => {
        const onHashChange = () => {
            setHash(location.hash.slice(1));
            options?.tellParentFrame && window.parent.postMessage({
                type: "navigate",
                url: location.href,
            }, "*");
            console.log("Posting", location.href + "-navigate")
        };

        window.addEventListener("hashchange", onHashChange);

        return () => {
            window.removeEventListener("hashchange", onHashChange);
        };
    });

    return {
        navigate: (url: string) => {
            location.hash = url;
        },
        route: function <P extends string = ''>(route: `${string}` | `/${string}/:${P}`, paramUser: (param: P) => ReactNode) {
            if (route.includes(":")) {
                const [routePath, _paramName] = route.split(":");
                if (routePath && hash.startsWith(routePath)) {
                    const param = hash.split(routePath!)[1];
                    return paramUser(param as P);
                }
            } else {
                return hash === route ? paramUser('' as P) : null;
            }
        }
    }
}