import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthAndJazz } from "./jazz";
import { ResumeSyncState } from "./pages/ResumeSyncState";
import { TestInput } from "./pages/TestInput";

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
