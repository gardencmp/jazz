import React from "react";
import ReactDOM from "react-dom/client";
import { AuthAndJazz } from "./jazz";
import { TestInput } from "./pages/TestInput";
import { ResumeSyncState } from "./pages/ResumeSyncState";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  {
      path: "/test-input",
      element: <TestInput />,
  },
  {
      path: "/resume-sync",
      element: <ResumeSyncState />,
  },
  {
      path: "/",
      element: <TestInput />,
  },
]);


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
      <AuthAndJazz>
          <RouterProvider router={router} />
      </AuthAndJazz>
  </React.StrictMode>,
);
