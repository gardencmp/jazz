import { CoID, RawCoValue } from "cojson";
import { useCallback, useEffect, useState } from "react";
import { PageInfo } from "./types";

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

  const updatePath = useCallback((newPath: PageInfo[]) => {
    setPath(newPath);
    const hash = encodePathToHash(newPath);
    window.location.hash = `#/${hash}`;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2);
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
    if (defaultPath && JSON.stringify(path) !== JSON.stringify(defaultPath)) {
      updatePath(defaultPath);
    }
  }, [defaultPath, path, updatePath]);

  const addPages = useCallback(
    (newPages: PageInfo[]) => {
      updatePath([...path, ...newPages]);
    },
    [path, updatePath],
  );

  const goToIndex = useCallback(
    (index: number) => {
      updatePath(path.slice(0, index + 1));
    },
    [path, updatePath],
  );

  const setPage = useCallback(
    (coId: CoID<RawCoValue>) => {
      updatePath([{ coId, name: "Root" }]);
    },
    [updatePath],
  );

  const goBack = useCallback(() => {
    if (path.length > 1) {
      updatePath(path.slice(0, path.length - 1));
    }
  }, [path, updatePath]);

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
