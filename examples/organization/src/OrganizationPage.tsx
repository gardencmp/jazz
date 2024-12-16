import { ID } from "jazz-tools";
import { useParams } from "react-router";
import { Layout } from "./Layout.tsx";
import { Organization } from "./schema.ts";

export function OrganizationPage() {
  const paramOrganizationId = useParams<{ organizationId: ID<Organization> }>()
    .organizationId;

  return (
    <Layout>
      <h1>Organization</h1>
      <p>This is the organization page for {paramOrganizationId}.</p>
    </Layout>
  );
}
