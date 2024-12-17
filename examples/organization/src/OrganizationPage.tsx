import { ID } from "jazz-tools";
import { useParams } from "react-router";
import { Layout } from "./Layout.tsx";
import { InviteLink } from "./components/organization/InviteLink.tsx";
import { OrganizationMembers } from "./components/organization/OrganizationMembers.tsx";
import { OrganizationSelector } from "./components/organization/OrganizationSelector.tsx";
import { CreateProject } from "./components/project/CreateProject.tsx";
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
        <div className="flex justify-between">
          <h1 className="text-3xl font-semibold">
            <strong>Welcome to {organization.name}!</strong>
          </h1>

          <OrganizationSelector />
        </div>

        <div className="rounded-lg border shadow-sm bg-white">
          <div className="border-b px-4 py-5 sm:px-6">
            <div className="flex justify-between items-center">
              <h2>Members</h2>

              {organization._owner?.myRole() === "admin" && (
                <InviteLink organization={organization} />
              )}
            </div>
          </div>
          <div className="divide-y">
            <OrganizationMembers organization={organization} />
          </div>
        </div>

        <div className="rounded-lg border shadow-sm bg-white">
          <div className="border-b px-4 py-5 sm:px-6">
            <h2>Projects</h2>
          </div>
          <div className="divide-y">
            {organization.projects.length > 0 ? (
              organization.projects.map((project) =>
                project ? (
                  <strong
                    key={project.id}
                    className="px-4 py-5 sm:px-6 font-medium block"
                  >
                    {project.name}
                  </strong>
                ) : null,
              )
            ) : (
              <p className="col-span-full text-center px-4 py-8 sm:px-6">
                You have no projects yet.
              </p>
            )}
            <div className="p-4 sm:p-6">
              <CreateProject organizationId={organization.id} />
            </div>
          </div>
        </div>

        <div></div>
      </div>
    </Layout>
  );
}
