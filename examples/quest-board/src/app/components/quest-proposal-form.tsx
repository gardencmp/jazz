import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { QuestProposalDraft } from "@/schema";

export function QuestProposalForm({
  onSubmit,
  draft,
}: { onSubmit: () => void; draft: QuestProposalDraft | undefined }) {
  if (!draft) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    draft.title = e.target.value;
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    draft.description = e.target.value;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="text"
        placeholder="Quest Title"
        aria-label="Quest Title"
        value={draft.title ?? ""}
        onChange={handleTitleChange}
        required
        className="bg-amber-100 border-amber-300 text-amber-900 placeholder-amber-500"
      />
      <Textarea
        placeholder="Quest Description"
        aria-label="Quest Description"
        value={draft.description ?? ""}
        onChange={handleDescriptionChange}
        required
        className="bg-amber-100 border-amber-300 text-amber-900 placeholder-amber-500"
      />
      <Button
        type="submit"
        className="w-full bg-amber-700 hover:bg-amber-800 text-amber-100"
      >
        Submit Quest Proposal
      </Button>
    </form>
  );
}
