import React from "react";
import ReactDOM from "react-dom/client";
import { AuthAndJazz } from "./jazz";
import { TestInput } from "./pages/TestInput";
import { RouterProvider, createHashRouter } from "react-router-dom";

const router = createHashRouter([
  {
      path: "/",
      element: <TestInput />,
  },
  {
      path: "/test-input",
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
