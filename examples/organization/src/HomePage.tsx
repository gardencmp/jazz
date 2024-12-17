import { Layout } from "./Layout.tsx";
import { Heading } from "./components/Heading.tsx";
import { CreateOrganization } from "./components/organization/CreateOrganization.tsx";

export function HomePage() {
  return (
    <Layout>
      <Heading text="Create an organization" />

      <div className="rounded-lg border shadow-sm bg-white p-4 sm:p-6">
        <CreateOrganization />
      </div>
    </Layout>
  );
}
