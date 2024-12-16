import { ID } from "jazz-tools";
import { useParams } from "react-router";
import { CreateProject } from "./CreateProject.tsx";
import { Layout } from "./Layout.tsx";
import { useCoState } from "./main.tsx";
import { Organization } from "./schema.ts";

export function OrganizationPage() {
  const paramOrganizationId = useParams<{ organizationId: ID<Organization> }>()
    .organizationId;

  const organization = useCoState(Organization, paramOrganizationId, {
    projects: [],
  });

  if (!organization) return <p>Loading organization...</p>;

  return (
    <Layout>
      <div className="grid gap-8">
        <h1 className="text-2xl font-medium">
          <strong>Projects</strong>
        </h1>

        <div className="grid gap-3 md:grid-cols-3 md:gap-8">
          {organization.projects.length > 0 ? (
            organization.projects.map((project) =>
              project ? <div className="p-3 border">{project.name}</div> : null,
            )
          ) : (
            <p className="col-span-full">You have no projects yet.</p>
          )}
        </div>
        <div className="max-w-md">
          <CreateProject organizationId={organization.id} />
        </div>
      </div>
    </Layout>
  );
}
