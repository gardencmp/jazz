import { Account, Group, ID } from "jazz-tools";
import { useAccount } from "../../main.tsx";
import { Organization } from "../../schema.ts";

const addMember = async (
  organization: Organization,
  accountId: ID<Account>,
  me: Account,
) => {
  const account = await Account.load(accountId as ID<Account>, me, []);
  if (!account) return;
  organization._owner.castAs(Group).addMember(account, "writer");
};

export function AddMember({ organization }: { organization: Organization }) {
  const { me } = useAccount();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const accountId = formData.get("accountId");

    if (!accountId || !organization) return;

    addMember(organization, accountId as ID<Account>, me);
  };

  return (
    <form className="flex gap-3" onSubmit={onSubmit}>
      <input
        type="text"
        name="accountId"
        placeholder="Account ID"
        className="flex-1 dark:bg-transparent"
      />
      <button type="submit">Add</button>
    </form>
  );
}
