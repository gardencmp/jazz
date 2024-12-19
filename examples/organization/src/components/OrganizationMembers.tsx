import { Account, Group, ID } from "jazz-tools";
import { useCoState } from "../main.tsx";
import { Organization } from "../schema.ts";

export function OrganizationMembers({
  organization,
}: { organization: Organization }) {
  const group = organization._owner.castAs(Group);

  return (
    <>
      {group.members.map((member) => (
        <Member
          key={member.id}
          accountId={member.id as ID<Account>}
          role={member.role}
        />
      ))}
    </>
  );
}
function Member({
  accountId,
  role,
}: { accountId: ID<Account>; role?: string }) {
  const account = useCoState(Account, accountId, { profile: {} });

  if (!account?.profile) return;

  return (
    <div className="px-4 py-5 sm:px-6">
      <strong className="font-medium">{account.profile.name}</strong> ({role})
    </div>
  );
}
