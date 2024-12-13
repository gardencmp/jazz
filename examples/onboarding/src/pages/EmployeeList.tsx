import { NavLink } from "@/components/NavLink.tsx";
import { NavigateButton } from "@/components/NavigateBack.tsx";
import { Stack } from "@/components/Stack.tsx";
import { useCoState } from "@/main.tsx";
import { CoEmployee, EmployeeCoList } from "@/schema.ts";
import { ID } from "jazz-tools";

export function EmployeeList({
  employeeListCoId,
}: {
  employeeListCoId: ID<EmployeeCoList>;
}) {
  const employees = useCoState(EmployeeCoList, employeeListCoId, {
    resolve: { each: true },
  });

  if (!employees) {
    return <div>Loading...</div>;
  }

  return (
    <Stack>
      <NavigateButton to="/employee/new" text={"Add New Employee"} />
      <ul className="max-w-md">
        {employees.map((employee: CoEmployee) =>
          employee.deleted ? null : (
            <li key={employee.id} className="flex flex-row space-x-8 w-full">
              <span>{employee._owner.myRole()}</span>
              <span className="w-1/3">
                <NavLink to={`/employee/${employee.id}`}>
                  {employee.name}
                </NavLink>
              </span>
              {employee.finalStep?.done && <span>✅</span>}
              {employee._owner.myRole() === "admin" &&
                !employee.finalStep?.done && (
                  <span
                    onClick={() => {
                      employee.deleted = true;
                    }}
                    className="cursor-pointer"
                  >
                    🗑
                  </span>
                )}
            </li>
          ),
        )}
      </ul>
    </Stack>
  );
}
