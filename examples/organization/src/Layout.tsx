import { UserIcon } from "lucide-react";
import { useAccount } from "./main.tsx";

export function Layout({ children }: { children: React.ReactNode }) {
  const { me, logOut } = useAccount({
    root: { draftOrganization: {} },
  });

  return (
    <>
      <header className="bg-white shadow-sm mb-12 dark:bg-stone-925 dark:border-b">
        <div className="w-full max-w-4xl mx-auto px-4 py-3 flex gap-4  items-center">
          <a href="/#">Home</a>

          <span className="ml-auto flex items-center gap-2">
            <span className="bg-stone-500 pt-1 size-6 flex items-center justify-center rounded-full">
              <UserIcon size={20} className="stroke-white" />
            </span>
            {me?.profile?.name}
          </span>

          <button
            className="bg-stone-100 py-1.5 px-3 text-sm rounded-md dark:bg-stone-900 dark:text-white"
            onClick={() => {
              window.location.href = "/";
              logOut();
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="px-4 py-3 max-w-4xl mx-auto flex flex-col gap-8">
        {children}
      </main>
    </>
  );
}
