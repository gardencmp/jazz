import { Button } from "@/components/Button.tsx";
import { NavigateBack } from "@/components/NavigateBack.tsx";
import { Stack } from "@/components/Stack.tsx";
import { TextInput } from "@/components/TextInput.tsx";
import { useAcceptInvite, useCoState } from "@/main.tsx";
import { createImage } from "jazz-browser-media-images";
import { ProgressiveImg, createInviteLink } from "jazz-react";
import { CoMap, ID } from "jazz-tools";
import { ChangeEvent, ReactNode, useCallback } from "react";
import { useParams } from "react-router";
import { useNavigate } from "react-router-dom";
import {
  CoDocUploadStep,
  CoEmployee,
  CoFinalStep,
  CoInitialStep,
} from "../schema.ts";

const Card = ({
  children,
  title,
  isDone,
  isActive,
}: {
  children: ReactNode;
  title: string;
  isDone: boolean;
  isActive?: boolean;
}) => (
  <div
    className={`w-full p-4 bg-white border border-gray-200 rounded-lg shadow max-w-md ${
      isActive ? "border-gray-900 hover:bg-green-50 shadow-xl" : ""
    }`}
  >
    <Stack horizontal={true}>
      <h5 className="mb-2 text-2xl text-gray-900">{title}</h5>
      <h6 className="mb-2 text-2xl">
        {isDone ? "✅" : isActive ? "❓" : "⌛"}
      </h6>
    </Stack>
    {children}
  </div>
);

const InfoCard = ({
  initialStep,
  canWrite,
}: {
  initialStep: CoInitialStep;
  canWrite: boolean;
}) => {
  const isDisabled = !initialStep.isCurrentStep() || !canWrite;

  return (
    <Card
      title="Personal Info"
      isDone={initialStep?.done}
      isActive={initialStep.isCurrentStep()}
    >
      <Stack>
        <TextInput
          disabled={isDisabled}
          id="ssn"
          label="Social Security Number"
          value={initialStep.ssn || ""}
          onChange={({ target: { value } }) => (initialStep.ssn = value)}
        />
        <TextInput
          disabled={isDisabled}
          id="address"
          label="Address"
          value={initialStep.address || ""}
          onChange={({ target: { value } }) => (initialStep.address = value)}
        />
        {!initialStep.done && (
          <Button
            text={"Upload step >"}
            disabled={!initialStep.ssn || !initialStep.address || isDisabled}
            onClick={() => (initialStep.done = true)}
          />
        )}
      </Stack>
    </Card>
  );
};

const UploadCard = ({
  uploadStep,
  canWrite,
}: {
  uploadStep: CoDocUploadStep;
  canWrite: boolean;
}) => {
  const isDisabled = !uploadStep.isCurrentStep() || !canWrite;

  const onImageSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;

      const image = await createImage(event.target.files[0], {
        owner: uploadStep._owner,
      });

      uploadStep.photo = image;
    },
    [uploadStep],
  );

  return (
    <Card
      title="Uploads"
      isDone={uploadStep?.done}
      isActive={uploadStep.isCurrentStep()}
    >
      <Stack>
        {uploadStep.photo && (
          <ProgressiveImg image={uploadStep.photo}>
            {({ src }) => (
              <img
                className="max-h-full max-w-full rounded-l-sm rounded-r-md shadow-lg p-2"
                src={src}
              />
            )}
          </ProgressiveImg>
        )}

        {!uploadStep.done && (
          <>
            <input
              type="file"
              disabled={isDisabled}
              onChange={onImageSelected}
              data-testid="file-upload"
            />
            <Button
              text={"Confirmation step >"}
              disabled={isDisabled || !uploadStep.photo}
              onClick={() => (uploadStep.done = true)}
            />
          </>
        )}
      </Stack>
    </Card>
  );
};

const ConfirmationCard = ({
  finalStep,
  editable,
}: {
  finalStep: CoFinalStep;
  editable: boolean;
}) => {
  const isDisabled = !finalStep.isCurrentStep() || !editable;
  return (
    <Card
      title="Confirmation by admin"
      isDone={finalStep?.done}
      isActive={finalStep.isCurrentStep()}
    >
      <Stack>
        {!finalStep.done && (
          <Button
            text="Confirmation by admin"
            disabled={isDisabled}
            onClick={() => (finalStep.done = true)}
          />
        )}
      </Stack>
    </Card>
  );
};

export function EmployeeOnboading() {
  const { employeeCoId } = useParams();
  const navigate = useNavigate();

  const employee = useCoState(CoEmployee, employeeCoId as ID<CoEmployee>, {});

  useAcceptInvite({
    invitedObjectSchema: CoEmployee,
    onAccept: (employeeCoId) => {
      navigate(`/import/${employeeCoId}`);
    },
  });

  const handleInviteLinkCreation = useCallback(
    (role: "reader" | "writer") => {
      if (!employee) return;

      const link = createInviteLink(employee, role);
      navigator.clipboard.writeText(link);
      alert("Invite link copied to clipboard!");
    },
    [employee],
  );

  const isMeWriter = (step: CoMap): boolean => {
    return ["writer", "admin"].includes(step._owner.myRole() || "");
  };

  return (
    <>
      <Stack>
        <Stack horizontal={true}>
          <NavigateBack />
          {employee?._owner.myRole() === "admin" && (
            <Button
              text={"Invite a co-worker"}
              onClick={() => handleInviteLinkCreation("writer")}
            />
          )}
        </Stack>
        <h2 className="mb-2 text-2xl text-gray-900 font-semibold">
          {employee ? employee.name : "Loading..."}
        </h2>
      </Stack>

      {employee && (
        <Stack>
          {employee.initialStep ? (
            <InfoCard
              initialStep={employee.initialStep}
              canWrite={isMeWriter(employee.initialStep)}
            />
          ) : (
            <div>Loading...</div>
          )}
          {employee.docUploadStep ? (
            <UploadCard
              uploadStep={employee.docUploadStep}
              canWrite={isMeWriter(employee.docUploadStep)}
            />
          ) : (
            <div>Loading...</div>
          )}
          {employee.finalStep ? (
            <ConfirmationCard
              finalStep={employee.finalStep}
              editable={isMeWriter(employee.finalStep)}
            />
          ) : (
            <div>Loading...</div>
          )}
        </Stack>
      )}
    </>
  );
}
