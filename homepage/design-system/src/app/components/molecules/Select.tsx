"use client";

import { clsx } from "clsx";
import { ChevronDownIcon } from "lucide-react";
import { useId } from "react";

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string },
) {
  const { label, id: customId, className, size } = props;
  const generatedId = useId();
  const id = customId || generatedId;

  const containerClassName = clsx("grid gap-1", className);

  const selectClassName = clsx(
    "g-select",
    "w-full rounded-md border shadow-sm px-2 py-1.5 text-sm",
    "font-medium text-stone-900",
    "dark:text-white",
    "appearance-none cursor-pointer",
    "transition-colors hover:border-stone-300 dark:hover:border-stone-800",
  );

  return (
    <div className={containerClassName}>
      <label htmlFor={id} className="text-stone-600 dark:text-stone-300">
        {label}
      </label>

      <div className="relative flex items-center">
        <select {...props} id={id} className={selectClassName}>
          {props.children}
        </select>

        <ChevronDownIcon
          className="absolute right-[0.5em] text-stone-400 dark:text-stone-600"
          size={16}
        />
      </div>
    </div>
  );
}
