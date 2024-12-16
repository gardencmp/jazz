import { ID } from "jazz-tools";
import { useParams } from "react-router";
import { CreateProject } from "./CreateProject.tsx";
import { Layout } from "./Layout.tsx";
import { LinkToHome } from "./LinkToHome.tsx";
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
      <LinkToHome />
      <h1>Organization</h1>
      <p>
        This is the organization page for <strong>{organization.name}</strong>.
      </p>

      <div>
        <h2>
          <strong>Projects</strong>
        </h2>

        {organization.projects.length > 0 ? (
          <ul className="list-disc pl-4">
            {organization.projects.map((project) =>
              project ? <li>{project.name}</li> : null,
            )}
          </ul>
        ) : (
          <p>No projects</p>
        )}
      </div>

      <div>
        <CreateProject organizationId={organization.id} />
      </div>
    </Layout>
  );
}
