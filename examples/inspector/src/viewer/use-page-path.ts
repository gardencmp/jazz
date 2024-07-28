import { useState, useEffect } from "react";
import { PageInfo } from "./types";
import { CoID, RawCoValue } from "cojson";

export function usePagePath(defaultPath?: PageInfo[]) {
    const [path, setPath] = useState<PageInfo[]>(() => {
        const hash = window.location.hash.slice(2); // Remove '#/'
        if (hash) {
            try {
                return decodePathFromHash(hash);
            } catch (e) {
                console.error("Failed to parse hash:", e);
            }
        }
        return defaultPath || [];
    });

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(2); // Remove '#/'
            if (hash) {
                try {
                    const newPath = decodePathFromHash(hash);
                    setPath(newPath);
                } catch (e) {
                    console.error("Failed to parse hash:", e);
                }
            } else if (defaultPath) {
                setPath(defaultPath);
            }
        };

        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [defaultPath]);

    useEffect(() => {
        const hash = encodePathToHash(path);
        window.history.replaceState(null, "", `#/${hash}`);
    }, [path]);

    useEffect(() => {
        if (
            defaultPath &&
            JSON.stringify(path) !== JSON.stringify(defaultPath)
        ) {
            setPath(defaultPath);
        }
    }, [defaultPath]);

    const addPages = (newPages: PageInfo[]) => {
        setPath((prevPath) => [...prevPath, ...newPages]);
    };

    const goToIndex = (index: number) => {
        setPath((prevPath) => prevPath.slice(0, index + 1));
    };

    const setPage = (coId: CoID<RawCoValue>) => {
        setPath([{ coId, name: "Root" }]);
    };

    const goBack = () => {
        setPath((prevPath) =>
            prevPath.length > 1
                ? prevPath.slice(0, prevPath.length - 1)
                : prevPath,
        );
    };

    return {
        path,
        setPage,
        addPages,
        goToIndex,
        goBack,
    };
}

function encodePathToHash(path: PageInfo[]): string {
    return path
        .map((page) => {
            if (page.name && page.name !== "Root") {
                return `${page.coId}:${encodeURIComponent(page.name)}`;
            }
            return page.coId;
        })
        .join("/");
}

function decodePathFromHash(hash: string): PageInfo[] {
    return hash.split("/").map((segment) => {
        const [coId, encodedName] = segment.split(":");
        return {
            coId,
            name: encodedName ? decodeURIComponent(encodedName) : undefined,
        } as PageInfo;
    });
}
