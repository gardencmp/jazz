import { listenForCmdJ } from "jazz-tools";
import React from "react";
import { Navigate, RouterProvider, createHashRouter } from "react-router-dom";
import { Folder } from "./1_schema";
import { useAcceptInvite } from "./2_main";
import VaultPage from "./3_vault";

listenForCmdJ();

const App: React.FC = () => {
  const router = createHashRouter([
    {
      path: "/",
      element: <Navigate to={"/vault"} />,
    },
    {
      path: "/vault",
      element: <VaultPage />,
    },
    {
      path: "/vault/:sharedFolderId",
      element: <VaultPage />,
    },
    {
      path: "/invite/*",
      element: <p>Accepting invite...</p>,
    },
  ]);

  useAcceptInvite({
    invitedObjectSchema: Folder,
    onAccept: async (sharedFolderId) => {
      router.navigate(`/vault/${sharedFolderId}`);
    },
  });

  return <RouterProvider router={router} />;
};

export default App;
