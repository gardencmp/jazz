import { CreateOrganization } from "./CreateOrganization.tsx";
import { Layout } from "./Layout.tsx";

export function HomePage() {
  return (
    <Layout>
      <h1 className="text-2xl font-medium">
        <strong>Create an organization</strong>
      </h1>
      <CreateOrganization />
    </Layout>
  );
}
