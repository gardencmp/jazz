import { ID } from "jazz-tools";
import { useState } from "react";
import { Errors } from "./Errors.tsx";
import { OrganizationForm } from "./OrganizationForm.tsx";
import { useAccount, useCoState } from "./main.tsx";
import { DraftOrganization, ListOfProjects, Organization } from "./schema.ts";

export function CreateOrganization() {
  const { me } = useAccount({
    root: { draftOrganization: {}, organizations: [] },
  });
  const [errors, setErrors] = useState<string[]>([]);

  console.log(me?.root?.draftOrganization);

  if (!me?.root?.organizations) return;

  const onSave = (draft: DraftOrganization) => {
    // validate if the draft is a valid order
    const validation = draft.validate();
    setErrors(validation.errors);
    if (validation.errors.length > 0) {
      return;
    }

    me.root.organizations.push(draft as Organization);

    me.root.draftOrganization = DraftOrganization.create(
      {
        projects: ListOfProjects.create([], { owner: me }),
      },
      { owner: me },
    );
  };

  return (
    <>
      {errors && <Errors errors={errors} />}
      <CreateOrganizationForm
        id={me?.root?.draftOrganization?.id}
        onSave={onSave}
      />
    </>
  );
}

function CreateOrganizationForm({
  id,
  onSave,
}: {
  id: ID<DraftOrganization>;
  onSave: (draft: DraftOrganization) => void;
}) {
  const draft = useCoState(DraftOrganization, id);

  if (!draft) return;

  const addOrganization = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(draft);
  };

  return <OrganizationForm organization={draft} onSave={addOrganization} />;
}
