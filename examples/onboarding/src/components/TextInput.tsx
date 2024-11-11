import { ChangeEvent } from "react";

export function TextInput({
  id,
  value,
  label,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block mb-2 font-medium text-gray-900 dark:text-white"
      >
        {label}
      </label>
      <input
        value={value}
        onChange={onChange}
        type="text"
        id={id}
        disabled={disabled}
        className="disabled:cursor-not-allowed bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        placeholder="John"
        required
      />
    </div>
  );
}
