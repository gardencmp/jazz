import { RouterProvider, createHashRouter } from "react-router-dom";
import { HomePage } from "./HomePage.tsx";
import { useAccount } from "./main";

function App() {
  const { me, logOut } = useAccount({
    root: { draftOrganization: {} },
  });

  const router = createHashRouter([
    {
      path: "/",
      element: <HomePage />,
    },
    {
      path: "/organizations/:organizationId",
      element: <HomePage />,
    },
  ]);

  return (
    <div className="container flex flex-col gap-8">
      <header>
        <nav className="py-2 border-b flex items-center justify-between">
          <span>
            You're logged in as <strong>{me?.profile?.name}</strong>
          </span>
          <button
            className="bg-stone-100 py-1.5 px-3 text-sm rounded-md dark:bg-stone-900 dark:text-white"
            onClick={() => logOut()}
          >
            Log out
          </button>
        </nav>
      </header>

      <RouterProvider router={router} />
    </div>
  );
}

export default App;
