import { RouterProvider, createHashRouter } from "react-router-dom";
import { HomePage } from "./HomePage.tsx";
import { OrganizationPage } from "./OrganizationPage.tsx";

function Router() {
  const router = createHashRouter([
    {
      path: "/",
      element: <HomePage />,
    },
    {
      path: "/organizations/:organizationId",
      element: <OrganizationPage />,
    },
  ]);

  return <RouterProvider router={router}></RouterProvider>;
}

export default Router;
