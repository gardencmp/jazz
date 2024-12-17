import { OrganizationSelector } from "./OrganizationSelector.tsx";

export function Heading({ text }: { text: string }) {
  return (
    <div className="flex justify-between">
      <h1 className="text-3xl font-semibold">
        <strong>{text}</strong>
      </h1>

      <OrganizationSelector />
    </div>
  );
}
