import { Layout } from "./Layout.tsx";
import { CreateOrganization } from "./components/organization/CreateOrganization.tsx";

export function HomePage() {
  return (
    <Layout>
      <h1 className="text-3xl font-medium">
        <strong>Create an organization</strong>
      </h1>
      <CreateOrganization />
    </Layout>
  );
}
