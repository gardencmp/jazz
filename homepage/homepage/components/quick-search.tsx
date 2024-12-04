import { Search } from "lucide-react";

export function QuickSearch({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-2 text-stone-400 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800
    transition-all duration-200 ease-in-out
    hover:border-stone-300 dark:hover:border-stone-700
    hover:shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]
    hover:text-stone-600 dark:hover:text-stone-300 text-sm"
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">Quick search...</span>
      <span className="text-xs bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
        ⌘K
      </span>
    </button>
  );
}
