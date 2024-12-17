import { Layout } from "./Layout.tsx";
import { CreateOrganization } from "./components/CreateOrganization.tsx";
import { Heading } from "./components/Heading.tsx";

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
