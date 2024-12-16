import { useAccount } from "./main.tsx";

export function DraftIndicator() {
  const { me } = useAccount({
    profile: { draft: {} },
  });

  if (me?.profile.draft?.hasChanges) {
    return (
      <div className="absolute -top-1 -right-1 bg-blue-500 border-2 border-white w-3 h-3 rounded-full dark:border-stone-925">
        <span className="sr-only">You have a draft</span>
      </div>
    );
  }
}
