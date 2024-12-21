import React from "react";
import ReactDOM from "react-dom/client";
import { Link, RouterProvider, createBrowserRouter } from "react-router-dom";
import { AuthAndJazz } from "./jazz";
import { FileStreamTest } from "./pages/FileStream";
import { Inbox } from "./pages/Inbox";
import { ResumeSyncState } from "./pages/ResumeSyncState";
import { RetryUnavailable } from "./pages/RetryUnavailable";
import { Sharing } from "./pages/Sharing";
import { TestInput } from "./pages/TestInput";
import { WriteOnlyRole } from "./pages/WriteOnly";

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
      <li>
        <Link to="/sharing">Sharing</Link>
      </li>
      <li>
        <Link to="/write-only">Write Only</Link>
      </li>
      <li>
        <Link to="/inbox">Inbox</Link>
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
    path: "/sharing",
    element: <Sharing />,
  },
  {
    path: "/write-only",
    element: <WriteOnlyRole />,
  },
  {
    path: "/inbox",
    element: <Inbox />,
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
