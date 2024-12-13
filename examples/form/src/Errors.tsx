export function Errors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-md bg-red-50 border border-red-50 p-4 text-sm text-red-600 dark:bg-transparent dark:border-red-500 dark:text-red-500">
      <ul role="list" className="list-disc space-y-1 pl-5">
        {errors.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
