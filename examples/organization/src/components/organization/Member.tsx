import { Account, ID } from "jazz-tools";
import { useCoState } from "../../main.tsx";

export function Member({
  accountId,
  role,
}: { accountId: ID<Account>; role?: string }) {
  const account = useCoState(Account, accountId, { profile: {} });

  if (!account?.profile) return;

  return (
    <div className="p-3 border">
      <strong>{account.profile.name}</strong> ({role})
    </div>
  );
}
