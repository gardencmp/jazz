import { clsx } from "clsx";
import { useId } from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  // label is required for a11y, but you can hide it with a "label:sr-only" className
  label: string;
  type?: "text" | "email" | "number";
}

export function Input(props: Props) {
  const { label, id: customId, className, type = "text" } = props;
  const generatedId = useId();
  const id = customId || generatedId;

  const inputClassName = clsx(
    "w-full rounded-md border px-3.5 py-2 shadow-sm",
    "font-medium text-stone-900",
    "dark:text-white",
  );

  const containerClassName = clsx("grid gap-1", className);

  return (
    <div className={containerClassName}>
      <label htmlFor={id} className="text-stone-600 dark:text-stone-300">
        {label}
      </label>

      <input {...props} type={type} id={id} className={inputClassName} />
    </div>
  );
}
