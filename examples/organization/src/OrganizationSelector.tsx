import { ID } from "jazz-tools";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAccount } from "./main.tsx";
import { Organization } from "./schema.ts";

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

  useEffect(() => {
    if (organizationId) {
      navigate(`/organizations/${organizationId}`);
    }
  }, [organizationId]);

  return (
    <div className={[className, "flex flex-col gap-2"].join(" ")}>
      <label htmlFor="organization" className="md:sr-only">
        Organization
      </label>
      <select
        id="organization"
        value={organizationId}
        onChange={(e) => setOrganizationId(e.target.value)}
        className="dark:bg-transparent w-full"
      >
        {me?.root.organizations.map((organization) => {
          return (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          );
        })}
      </select>
    </div>
  );
}
