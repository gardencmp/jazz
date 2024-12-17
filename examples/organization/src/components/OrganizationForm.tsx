import { DraftOrganization, Organization } from "../schema.ts";

export function OrganizationForm({
  organization,
  onSave,
}: {
  organization: Organization | DraftOrganization;
  onSave?: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSave} className="grid gap-5 max-w-md">
      <div className="flex flex-col gap-2">
        <label htmlFor="name">Organization name</label>
        <input
          type="text"
          name="name"
          id="name"
          value={organization.name}
          className="dark:bg-transparent"
          onChange={(e) => (organization.name = e.target.value)}
          required
        />
      </div>
      {onSave && (
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Submit
        </button>
      )}
    </form>
  );
}
