import { CreateOrganization } from "./CreateOrganization.tsx";
import { OrganizationSelector } from "./OrganizationSelector.tsx";

export function HomePage() {
  return (
    <>
      <OrganizationSelector />
      <CreateOrganization />
    </>
  );
}
