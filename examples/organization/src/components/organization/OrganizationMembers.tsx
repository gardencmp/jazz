import { Account, Group, ID } from "jazz-tools";
import { Organization } from "../../schema.ts";
import { Member } from "./Member.tsx";

export function OrganizationMembers({
  organization,
}: { organization: Organization }) {
  const group = organization._owner.castAs(Group);

  return (
    <div className="grid gap-3">
      {group.members.map((member) => (
        <Member
          key={member.id}
          accountId={member.id as ID<Account>}
          role={member.role}
        />
      ))}
    </div>
  );
}
