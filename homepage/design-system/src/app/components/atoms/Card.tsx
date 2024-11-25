import { clsx } from "clsx";

export function Card({
  children,
  className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx(className, "border rounded-xl shadow-sm")}>
      {children}
    </div>
  );
}
