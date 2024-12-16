import { ID } from "jazz-tools";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAccount } from "./main.tsx";
import { Organization } from "./schema.ts";

export function OrganizationSelector() {
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
    <div className="flex gap-2 items-center">
      <label htmlFor="organization">Organization</label>
      <select
        id="organization"
        value={organizationId}
        onChange={(e) => setOrganizationId(e.target.value)}
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
