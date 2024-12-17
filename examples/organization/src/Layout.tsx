import { ID } from "jazz-tools";
import { UserIcon } from "lucide-react";
import { useParams } from "react-router";
import { OrganizationSelector } from "./components/organization/OrganizationSelector.tsx";
import { useAccount } from "./main.tsx";
import { Organization } from "./schema.ts";

export function Layout({ children }: { children: React.ReactNode }) {
  const { me, logOut } = useAccount({
    root: { draftOrganization: {} },
  });

  const paramOrganizationId = useParams<{ organizationId: ID<Organization> }>()
    .organizationId;

  return (
    <>
      <header className="flex gap-4 bg-white items-center shadow-sm px-4 py-3 mb-12">
        <a href={`/#/organizations/${paramOrganizationId}`}>Home</a>

        <OrganizationSelector className="hidden md:block" />

        <span className="ml-auto flex items-center gap-2">
          <span className="bg-stone-500 pt-1 size-6 flex items-center justify-center rounded-full">
            <UserIcon size={20} className="stroke-white" />
          </span>
          {me?.profile?.name}
        </span>

        <button
          className="bg-stone-100 py-1.5 px-3 text-sm rounded-md dark:bg-stone-900 dark:text-white"
          onClick={() => logOut()}
        >
          Log out
        </button>
      </header>

      <main className="px-4 py-3 max-w-4xl mx-auto flex flex-col gap-8">
        <OrganizationSelector className="block md:hidden" />

        {children}
      </main>
    </>
  );
}
