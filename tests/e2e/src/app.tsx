import React from "react";
import ReactDOM from "react-dom/client";
import { Link, RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthAndJazz } from "./jazz";
import { FileStreamTest } from "./pages/FileStream";
import { ResumeSyncState } from "./pages/ResumeSyncState";
import { RetryUnavailable } from "./pages/RetryUnavailable";
import { TestInput } from "./pages/TestInput";

function Index() {
  return (
    <ul>
      <li>
        <Link to="/test-input">Test Input</Link>
      </li>
      <li>
        <Link to="/resume-sync">Resume Sync</Link>
      </li>
      <li>
        <Link to="/file-stream">File Stream</Link>
      </li>
      <li>
        <Link to="/retry-unavailable">Retry Unavailable</Link>
      </li>
    </ul>
  );
}

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
    path: "/retry-unavailable",
    element: <RetryUnavailable />,
  },
  {
    path: "/file-stream",
    element: <FileStreamTest />,
  },
  {
    path: "/",
    element: <Index />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthAndJazz>
      <RouterProvider router={router} />
    </AuthAndJazz>
  </React.StrictMode>,
);
