import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthAndJazz } from "./jazz";
import { HomePage } from "./pages/Home";
import { TaskPage } from "./pages/Task";

const router = createBrowserRouter([
  {
    path: "/task/:taskID",
    element: <TaskPage />,
  },
  {
    path: "/",
    element: <HomePage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthAndJazz>
      <RouterProvider router={router} />
    </AuthAndJazz>
  </React.StrictMode>,
);
