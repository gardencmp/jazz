import { ID } from "jazz-tools";
import { useState } from "react";
import { Errors } from "./Errors.tsx";
import { ProjectForm } from "./ProjectForm.tsx";
import { useAccount, useCoState } from "./main.tsx";
import { DraftProject, Organization, Project } from "./schema.ts";

export function CreateProject({
  organizationId,
}: { organizationId: ID<Organization> }) {
  const { me } = useAccount({
    root: { draftProject: {} },
  });

  const organization = useCoState(Organization, organizationId, {
    projects: [],
  });

  const [errors, setErrors] = useState<string[]>([]);

  if (!me || !organization) return;

  const onSave = (draft: DraftProject) => {
    if (!organization) return;

    // validate if the draft is a valid order
    const validation = draft.validate();
    setErrors(validation.errors);
    if (validation.errors.length > 0) {
      return;
    }

    organization.projects.push(draft as Project);

    me.root.draftProject = DraftProject.create({}, { owner: me });
  };

  return (
    <>
      <h2>
        <strong>Create a project</strong>
      </h2>
      {errors && <Errors errors={errors} />}
      <CreateProjectForm id={me?.root?.draftProject?.id} onSave={onSave} />
    </>
  );
}

function CreateProjectForm({
  id,
  onSave,
}: {
  id: ID<DraftProject>;
  onSave: (draft: DraftProject) => void;
}) {
  const draft = useCoState(DraftProject, id);

  if (!draft) return;

  const addProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(draft);
  };

  return <ProjectForm project={draft} onSave={addProject} />;
}
