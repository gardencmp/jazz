import { Button } from "@/components/Button.tsx";
import { useAcceptInvite, useAccount, useCoState } from "@/main.tsx";
import { EmployeeList } from "@/pages/EmployeeList.tsx";
import { EmployeeOnboading } from "@/pages/EmployeeOnboarding.tsx";
import { NewEmployee } from "@/pages/NewEmployee.tsx";
import { CoEmployee, EmployeeCoList } from "@/schema.ts";
import { ID } from "jazz-tools";
import { useEffect } from "react";
import {
  RouterProvider,
  createHashRouter,
  useNavigate,
  useParams,
} from "react-router-dom";

function ImportEmployee({
  employeeListCoId,
}: { employeeListCoId: ID<EmployeeCoList> }) {
  const { employeeCoId } = useParams();
  const navigate = useNavigate();

  const employees = useCoState(EmployeeCoList, employeeListCoId, {
    resolve: { $each: true },
  });
  const employee = useCoState(CoEmployee, employeeCoId as ID<CoEmployee>);

  useEffect(() => {
    if (!employee || !employees) return;

    const exists = employees.find((employee) => employeeCoId === employee.id);

    if (!exists) {
      employees.push(employee);
    }
    navigate("/");
  }, [employee, employees, navigate]);

  return <div>Importing Employee ${employeeCoId} ...</div>;
}

function AcceptInvite() {
  const navigate = useNavigate();

  useAcceptInvite({
    invitedObjectSchema: CoEmployee,
    onAccept: (employeeCoId) => {
      navigate(`/import/${employeeCoId}`);
    },
  });

  return <p>Accepting invite...</p>;
}

function App() {
  const { me, logOut } = useAccount();
  const employeeCoListId = me.profile?._refs.employees.id;

  const router = createHashRouter([
    {
      path: "/",
      element: <EmployeeList employeeListCoId={employeeCoListId} />,
    },
    {
      path: "employee/new",
      element: <NewEmployee employeeListCoId={employeeCoListId} />,
    },
    {
      path: "/employee/:employeeCoId",
      element: <EmployeeOnboading />,
    },
    {
      path: "/import/:employeeCoId",
      element: <ImportEmployee employeeListCoId={employeeCoListId} />,
    },
    {
      path: "/invite/*",
      element: <AcceptInvite />,
    },
  ]);

  return (
    <>
      <header className="flex flex-wrap space-x-8   max-w-screen-lg m-2">
        <h1 className="text-3xl font-extrabold">
          Jazz Onboarding Flow example
        </h1>
        <Button
          onClick={() => {
            window.location.href = "/";
            logOut();
          }}
          text="Log Out"
        />
      </header>
      <main className="ml-2">
        {employeeCoListId && <RouterProvider router={router} />}
      </main>
    </>
  );
}

export default App;
