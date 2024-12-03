import React from "react";

export function Stack({
  children,
  horizontal,
}: {
  children: React.ReactNode;
  horizontal?: boolean;
}) {
  return (
    <div
      className={`container flex ${
        horizontal ? "flex-row" : "flex-col"
      } col ${horizontal ? "space-x-4 flex-wrap" : "space-y-4"} p-4`}
    >
      {children}
    </div>
  );
}
