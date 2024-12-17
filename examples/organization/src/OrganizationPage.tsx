import { ID } from "jazz-tools";
import { useParams } from "react-router";
import { CreateProject } from "./CreateProject.tsx";
import { InviteLink } from "./InviteLink.tsx";
import { Layout } from "./Layout.tsx";
import { OrganizationMembers } from "./OrganizationMembers.tsx";
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
        <h1>Welcome to {organization.name}!</h1>

        <div>
          <div className="flex justify-between items-center gap-3 mb-3">
            <h2 className="text-xl font-medium">
              <strong>Members</strong>
            </h2>
            {organization._owner.myRole() === "admin" && (
              <InviteLink organization={organization} />
            )}
          </div>

          <OrganizationMembers organization={organization} />
        </div>

        <div>
          <h2 className="text-xl font-medium mb-3">
            <strong>Projects</strong>
          </h2>

          <div className="grid gap-3 md:grid-cols-3 md:gap-8">
            {organization.projects.length > 0 ? (
              organization.projects.map((project) =>
                project ? (
                  <div key={project.id} className="p-3 border">
                    {project.name}
                  </div>
                ) : null,
              )
            ) : (
              <p className="col-span-full">You have no projects yet.</p>
            )}
          </div>
        </div>

        <div>
          <CreateProject organizationId={organization.id} />
        </div>
      </div>
    </Layout>
  );
}
