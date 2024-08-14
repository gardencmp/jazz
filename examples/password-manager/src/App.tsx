import React from "react";
import { createHashRouter, RouterProvider } from "react-router-dom";
import VaultPage from "./pages/vault";
import { useAcceptInvite } from "./main";
import { Folder } from "./schema";

const App: React.FC = () => {
  const router = createHashRouter([
    {
      path: "/vault",
      element: <VaultPage />,
    },
    {
      path: "/invite/*",
      element: <p>Accepting invite...</p>,
    },
  ]);

  useAcceptInvite({
    invitedObjectSchema: Folder,
    onAccept: () => router.navigate("/vault"),
  });

  return <RouterProvider router={router} />;
};

export default App;
