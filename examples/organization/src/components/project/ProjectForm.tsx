import { DraftProject, Project } from "../../schema.ts";

export function ProjectForm({
  project,
  onSave,
}: {
  project: Project | DraftProject;
  onSave?: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSave} className="flex gap-3 items-center">
      <label className="flex-1">
        <span className="sr-only">Project name</span>
        <input
          type="text"
          name="name"
          id="name"
          placeholder="Enter project name..."
          value={project.name}
          className="dark:bg-transparent w-full"
          onChange={(e) => (project.name = e.target.value)}
          required
        />
      </label>
      {onSave && (
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add project
        </button>
      )}
    </form>
  );
}
