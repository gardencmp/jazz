import { clsx } from "clsx";
import { Search } from "lucide-react";

export function QuickSearch({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full rounded-md border shadow-sm px-2 py-1.5 text-sm text-stone-900 dark:text-white",
        "flex items-center gap-2",
        "transition-colors hover:border-stone-400 dark:hover:border-stone-800",
      )}
    >
      <Search className="size-4" />
      <span className="text-stone-600 dark:text-stone-400">
        Quick search...
      </span>
      <kbd className="ml-auto font-medium text-stone-400 dark:text-stone-500">
        <kbd className="font-sans">⌘</kbd>
        <kbd className="font-sans">K</kbd>
      </kbd>
    </button>
  );
}
