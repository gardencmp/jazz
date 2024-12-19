import { Layout } from "./Layout.tsx";
import { CreateOrganization } from "./components/CreateOrganization.tsx";
import { Heading } from "./components/Heading.tsx";
import { useAccount } from "./main.tsx";

export function HomePage() {
  const { me } = useAccount({
    root: { organizations: [{}] },
  });

  if (!me?.root.organizations) return;

  return (
    <Layout>
      <Heading text="Organizations example app" />

      <div className="rounded-lg border shadow-sm bg-white dark:bg-stone-925">
        <div className="border-b px-4 py-5 sm:px-6">
          <h2>Organizations</h2>
        </div>
        <div className="divide-y">
          {me.root.organizations.length > 0 ? (
            me.root.organizations.map((project) =>
              project ? (
                <a
                  key={project.id}
                  className="px-4 py-5 sm:px-6 font-medium block"
                  href={`/#/organizations/${project.id}`}
                >
                  <strong>{project.name}</strong>
                </a>
              ) : null,
            )
          ) : (
            <p className="col-span-full text-center px-4 py-8 sm:px-6">
              You have no organizations yet.
            </p>
          )}
          <div className="p-4 sm:p-6">
            <CreateOrganization />
          </div>
        </div>
      </div>
    </Layout>
  );
}
