"use client";

import { Command } from "cmdk";
import React, { useState, useEffect } from "react";
import { singletonHook } from "react-singleton-hook";

export const usePagefindSearch = singletonHook(
  { open: false, setOpen: () => {} },
  () => {
    const [open, setOpen] = useState(false);
    return { open, setOpen };
  },
);

export function PagefindSearch() {
  const { open, setOpen } = usePagefindSearch();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  useEffect(() => {
    async function loadPagefind() {
      // @ts-expect-error pagefind.js generated after build
      if (typeof window.pagefind === "undefined") {
        try {
          // @ts-expect-error pagefind.js generated after build
          window.pagefind = await import(
            // @ts-expect-error pagefind.js generated after build
            /* webpackIgnore: true */ "../pagefind/pagefind.js"
          );
        } catch (e) {
          // @ts-expect-error pagefind.js generated after build
          window.pagefind = { search: () => ({ results: [] }) };
        }
      }
    }
    loadPagefind();
  }, []);

  async function handleSearch(value: string) {
    setQuery(value);
    // @ts-expect-error pagefind.js generated after build
    if (window.pagefind) {
      // @ts-expect-error pagefind.js generated after build
      const search = await window.pagefind.search(value);
      const results = await Promise.all(
        search.results.map((result: any) => result.data()),
      );
      setResults(results);
    }
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Search"
      className="fixed top-[10%] sm:top-1/2 left-1/2 -translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-auto z-20"
      shouldFilter={false}
    >
      <div
        className="w-full sm:w-[640px] mx-auto max-w-[calc(100%-2rem)] overflow-hidden rounded-xl bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl border border-gray-700
        origin-center animate-in fade-in
        data-[state=open]:animate-in data-[state=closed]:animate-out
        data-[state=open]:scale-100 data-[state=closed]:scale-95
        data-[state=closed]:opacity-0 data-[state=open]:opacity-100
        transition-all duration-200 ease-in-out
        hover:border-gray-600
        hover:shadow-[0_0_30px_rgba(0,0,0,0.2)]
        hover:shadow-indigo-500/10"
      >
        <Command.Input
          value={query}
          onValueChange={handleSearch}
          placeholder="Search documentation..."
          className="w-full text-base sm:text-lg px-4 sm:px-5 py-4 sm:py-5 outline-none border-b border-gray-700 bg-transparent text-gray-100 placeholder:text-gray-400 caret-indigo-500"
        />
        <Command.List className="h-[50vh] sm:h-[300px] max-h-[60vh] sm:max-h-[400px] overflow-y-auto overflow-x-hidden overscroll-contain transition-all duration-100 ease-in p-2">
          {results.length === 0 ? (
            <Command.Empty className="flex items-center justify-center h-16 text-sm text-gray-400">
              No results found.
            </Command.Empty>
          ) : (
            <Command.Group>
              {results.map((result: any) => (
                <SearchResult
                  key={result.id}
                  result={result}
                  setOpen={setOpen}
                />
              ))}
            </Command.Group>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}

function HighlightedText({ text }: { text: string }) {
  const decodedText = text.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const parts = decodedText.split(/(<mark>.*?<\/mark>)/g);

  return (
    <p className="text-xs text-gray-400 mt-1">
      {parts.map((part, i) => {
        if (part.startsWith("<mark>")) {
          const content = part.replace(/<\/?mark>/g, "");
          return (
            <mark
              key={i}
              className="bg-indigo-500/20 text-indigo-200 rounded px-0.5"
            >
              {content}
            </mark>
          );
        }
        return part;
      })}
    </p>
  );
}

function SearchResult({
  result,
  setOpen,
}: {
  result: any;
  setOpen: (open: boolean) => void;
}) {
  // const [data, setData] = useState<any>(null);

  // useEffect(() => {
  //   async function fetchData() {
  //     const data = await result.data();
  //     setData(data);
  //   }
  //   fetchData();
  // }, [result]);

  if (!result) {
    return null;
  }

  let url = result?.url
    ?.split("/_next/static/chunks/server/app/")?.[1]
    ?.split(".html")?.[0];

  return (
    <>
      <Command.Item
        value={result.meta.title}
        onSelect={() => {
          if (!url) return;
          const cleanUrl = url.startsWith("/") ? url : `/${url}`;
          window.location.href = `${window.location.origin}${cleanUrl}`;
          setOpen(false);
        }}
        className={`group relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 cursor-pointer text-sm rounded-md mt-1 select-none 
      transition-all duration-200 ease-in-out
      animate-in fade-in-0
      text-gray-100 data-[selected=true]:bg-gray-800/50 hover:bg-gray-800/30 active:bg-gray-800/50
      max-w-full`}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-gray-200 truncate">
            {result.meta?.title || "No title"}
          </h3>
          <HighlightedText text={result.excerpt || ""} />
        </div>

        <div className="absolute left-0 w-[3px] h-full bg-indigo-500 transition-opacity duration-200 ease-in-out opacity-0 group-data-[selected=true]:opacity-100" />
      </Command.Item>
      {/* Sub-results section */}
      {result.sub_results && result.sub_results.length > 0 && (
        <div className="ml-4 border-l border-gray-700">
          {result.sub_results.map((subResult: any) => {
            // to avoid showing the same result twice
            if (subResult.title === result.meta.title) return null;
            return (
              <Command.Item
                key={subResult.id}
                value={subResult.title}
                onSelect={() => {
                  const [subUrlPath, subUrlHash] = subResult?.url
                    ?.split("/_next/static/chunks/server/app/")?.[1]
                    ?.split(".html");
                  if (!subUrlPath) return;
                  const cleanSubUrl = subUrlPath.startsWith("/")
                    ? subUrlPath
                    : `/${subUrlPath}`;
                  const hash = subUrlHash ? `${subUrlHash}` : "";
                  window.location.href = `${window.location.origin}${cleanSubUrl}${hash}`;
                  setOpen(false);
                }}
                className={`group relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 cursor-pointer text-sm rounded-md mt-1 select-none 
            transition-all duration-200 ease-in-out
            animate-in fade-in-0
            text-gray-100 data-[selected=true]:bg-gray-800/50 hover:bg-gray-800/30 active:bg-gray-800/50
            max-w-full`}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-200/80 truncate">
                    {subResult?.title || "No title"}
                  </h3>
                  <HighlightedText text={subResult?.excerpt || ""} />
                </div>
                <div className="absolute left-0 w-[3px] h-full bg-indigo-500/70 transition-opacity duration-200 ease-in-out opacity-0 group-data-[selected=true]:opacity-100" />
              </Command.Item>
            );
          })}
        </div>
      )}
    </>
  );
}
