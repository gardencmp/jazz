import { clsx } from "clsx";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";

export function MobileNavigationDrawer({
  children,
  from,
  isOpen,
  onClose,
}: {
  children: React.ReactNode;
  from: "left" | "right";
  isOpen: boolean;
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
        "fixed top-0 w-screen h-screen z-60 overflow-y-auto",
        "p-8 pr-16 bg-white shadow-lg",
        "transition-all duration-500",
        isOpen ? positionClasses.active : positionClasses.inactive,
      )}
    >
      {children}
      <button
        type="button"
        className="absolute top-0 right-0 p-3"
        onClick={onClose}
      >
        <span className="sr-only">Close menu</span>
        <Icon name="close" />
      </button>
    </div>
  );
}
