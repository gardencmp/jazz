import { OrganizationSelector } from "./OrganizationSelector.tsx";
import { useAccount } from "./main.tsx";

export function Layout({ children }: { children: React.ReactNode }) {
  const { me, logOut } = useAccount({
    root: { draftOrganization: {} },
  });

  return (
    <div className="flex flex-col gap-10">
      <header className="flex gap-4 items-center border-b px-4 py-3">
        <a href="/#">Home</a>

        <OrganizationSelector className="hidden md:block" />

        <span className="ml-auto">{me?.profile?.name}</span>
        <button
          className="bg-stone-100 py-1.5 px-3 text-sm rounded-md dark:bg-stone-900 dark:text-white"
          onClick={() => logOut()}
        >
          Log out
        </button>
      </header>

      <main className="px-4 py-3 container flex flex-col gap-8">
        <OrganizationSelector className="block md:hidden" />

        {children}
      </main>
    </div>
  );
}
