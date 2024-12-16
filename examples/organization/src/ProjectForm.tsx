import { DraftProject, Project } from "./schema.ts";

export function ProjectForm({
  project,
  onSave,
}: {
  project: Project | DraftProject;
  onSave?: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSave} className="grid gap-5 max-w-md">
      <div className="flex flex-col gap-2">
        <label htmlFor="name">Project name</label>
        <input
          type="text"
          name="name"
          id="name"
          value={project.name}
          className="dark:bg-transparent"
          onChange={(e) => (project.name = e.target.value)}
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
