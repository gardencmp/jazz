import { Button } from "@/components/Button.tsx";
import { NavigateBack } from "@/components/NavigateBack.tsx";
import { Stack } from "@/components/Stack.tsx";
import { TextInput } from "@/components/TextInput.tsx";
import { useAccount, useCoState } from "@/main.tsx";
import { Group, ID } from "jazz-tools";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CoDocUploadStep,
  CoEmployee,
  CoFinalStep,
  CoInitialStep,
  EmployeeCoList,
} from "../schema.ts";

export function NewEmployee({
  employeeListCoId,
}: {
  employeeListCoId: ID<EmployeeCoList>;
}) {
  const navigate = useNavigate();
  const { me } = useAccount();

  const employees = useCoState(EmployeeCoList, employeeListCoId, [{}]);

  const [employeeName, setEmployeeName] = useState<string>("");

  const createEmployee = useCallback(() => {
    if (!employees) return;

    const writerGroup = Group.create({ owner: me });
    const readerGroup = Group.create({ owner: me });
    readerGroup.addMember("everyone", "reader");

    const initialStep = CoInitialStep.create(
      { done: false, type: "initial" },
      { owner: writerGroup },
    );

    const docUploadStep = CoDocUploadStep.create(
      { done: false, prevStep: initialStep, type: "upload" },
      { owner: writerGroup },
    );

    const finalStep = CoFinalStep.create(
      { done: false, prevStep: docUploadStep, type: "final" },
      { owner: readerGroup },
    );

    const employee = CoEmployee.create(
      {
        name: employeeName,
        initialStep,
        docUploadStep,
        finalStep,
      },
      { owner: writerGroup },
    );

    employees.push(employee);
    setEmployeeName("");
  }, [employeeName, employees]);

  return (
    <div className="w-96">
      <Stack>
        <NavigateBack />
        <form className="grid gap-3">
          <TextInput
            label="Employee name"
            id="employee-name"
            value={employeeName}
            onChange={({ target: { value } }) => setEmployeeName(value)}
          />
          <Button
            type="submit"
            disabled={!employeeName}
            onClick={() => {
              createEmployee();
              navigate("/");
            }}
            text="Create Employee"
          />
        </form>
      </Stack>
    </div>
  );
}
