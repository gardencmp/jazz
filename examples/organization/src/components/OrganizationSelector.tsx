import { ID } from "jazz-tools";
import { UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAccount } from "../main.tsx";
import { Organization } from "../schema.ts";

export function OrganizationSelector({ className }: { className?: string }) {
  const { me } = useAccount({
    root: { organizations: [{}] },
  });

  const navigate = useNavigate();

  const paramOrganizationId = useParams<{ organizationId: ID<Organization> }>()
    .organizationId;

  const [organizationId, setOrganizationId] = useState<string | undefined>();

  useEffect(() => {
    if (paramOrganizationId) {
      setOrganizationId(paramOrganizationId);
    }
  }, [paramOrganizationId]);

  const onSelectOrganization = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;

    if (value === "add") {
      navigate("/#");
      return;
    }

    setOrganizationId(value);
    navigate(`/organizations/${value}`);
  };

  return (
    <div className={[className, "flex items-center gap-3"].join(" ")}>
      <label htmlFor="organization" className="md:sr-only">
        Organization
      </label>
      <UsersIcon size={32} strokeWidth={1.5} />
      <select
        id="organization"
        value={organizationId}
        onChange={onSelectOrganization}
        className="rounded-md shadow-sm dark:bg-transparent w-full"
      >
        {me?.root.organizations.map((organization) => {
          return (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          );
        })}

        <option value="add">+ Create new organization</option>
      </select>
    </div>
  );
}
