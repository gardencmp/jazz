import { OrganizationSelector } from "./OrganizationSelector.tsx";

export function Heading({ text }: { text: string }) {
  return (
    <div className="flex justify-between">
      <h1 className="text-3xl font-semibold">{text}</h1>

      <OrganizationSelector />
    </div>
  );
}
