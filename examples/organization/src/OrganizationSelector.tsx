import { useAccount } from "./main.tsx";

export function OrganizationSelector() {
  const { me } = useAccount({
    root: { organizations: [{}] },
  });

  return (
    <div className="flex gap-2 items-center">
      <label htmlFor="organization">Organization</label>
      <select id="organization">
        {me?.root.organizations.map((organization) => {
          return <option key={organization.id}>{organization.name}</option>;
        })}
      </select>
    </div>
  );
}
