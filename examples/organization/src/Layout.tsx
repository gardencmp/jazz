import { OrganizationSelector } from "./OrganizationSelector.tsx";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganizationSelector />

      {children}
    </>
  );
}
