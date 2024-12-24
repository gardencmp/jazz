import { clsx } from "clsx";
import { Icon } from "../atoms/Icon";

export function NavigationDrawer({
  children,
  from,
  isOpen,
  onClose,
  title,
}: {
  children: React.ReactNode;
  from: "left" | "right";
  isOpen: boolean;
  title?: string;
  onClose: () => void;
}) {
  const positionClasses = {
    left: {
      active: "left-0",
      inactive: "left-[-100vw]",
    },
    right: {
      active: "right-0",
      inactive: "right-[-100vw]",
    },
  }[from];

  return (
    <div
      className={clsx(
        "fixed top-0 w-screen h-screen z-50 overflow-y-auto",
        "p-4 pb-20 bg-white dark:bg-stone-950 shadow-lg",
        "transition-all duration-500",
        isOpen ? positionClasses.active : positionClasses.inactive,
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <p className="text-lg font-medium text-stone-900 dark:text-white">
          {title}
        </p>
        <button type="button" onClick={onClose}>
          <span className="sr-only">Close menu</span>
          <Icon name="close" size="lg" />
        </button>
      </div>
      {children}
    </div>
  );
}
