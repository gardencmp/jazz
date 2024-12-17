import { RouterProvider, createHashRouter } from "react-router-dom";
import { AcceptInvite } from "./AcceptInvite.tsx";
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
    {
      path: "/invite/*",
      element: <AcceptInvite />,
    },
  ]);

  return <RouterProvider router={router}></RouterProvider>;
}

export default Router;
