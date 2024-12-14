const disabledClasses =
  "text-white bg-gray-400 dark:bg-gray-500 cursor-not-allowed";
const regularClasses =
  "text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800";

export function Button({
  text,
  onClick,
  disabled,
  type = "button",
  ...props
}: {
  text: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      {...props}
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`${
        disabled ? disabledClasses : regularClasses
      } text-base font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2`}
    >
      {text}
    </button>
  );
}
