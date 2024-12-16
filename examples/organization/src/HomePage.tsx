import { CreateOrganization } from "./CreateOrganization.tsx";
import { Layout } from "./Layout.tsx";

export function HomePage() {
  return (
    <Layout>
      <CreateOrganization />
    </Layout>
  );
}
