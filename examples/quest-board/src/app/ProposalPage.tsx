import { useCoState } from "@/app";
import { useQuestProposalDraft } from "@/lib/useQuestProposalDraft";
import { QuestBoard, QuestProposal } from "@/schema";
import { ID } from "jazz-tools";
import { QuestCard } from "./components/quest-card";
import { QuestProposalCard } from "./components/quest-proposal-card";
import { QuestProposalForm } from "./components/quest-proposal-form";

export default function ProposalPage({ boardID }: { boardID: ID<QuestBoard> }) {
  const board = useCoState(QuestBoard, boardID, {
    proposals: [{}],
    publicQuests: [{}],
  });
  const { draftProposal, clearDraftProposal } = useQuestProposalDraft();

  const handleSubmitProposal = () => {
    if (!board || !draftProposal) return;
    if (!draftProposal.title || !draftProposal.description) return;

    const ownership = { owner: board.proposals._owner };

    const proposal = QuestProposal.create(
      {
        title: draftProposal.title,
        description: draftProposal.description,
        status: "pending",
      },
      ownership,
    );

    clearDraftProposal();

    board.proposals.push(proposal);
  };

  return (
    <div className="min-h-screen bg-[url('/parchment-background.jpg')] bg-cover bg-center">
      <main className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-amber-900 font-serif">
          Public Fantasy Quest Board
        </h1>
        <div className="mb-8 text-center">
          <a
            href="/"
            className="bg-amber-700 text-amber-100 px-6 py-3 rounded-full hover:bg-amber-800 transition-colors font-semibold text-lg shadow-lg"
          >
            Go back to your board
          </a>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-amber-900 font-serif">
            Public board
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {board?.publicQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} isGuildMaster={false} />
            ))}
          </div>
        </div>
        <div className="mb-8 bg-amber-50 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-amber-900 font-serif">
            Submit a Quest Proposal
          </h2>
          <QuestProposalForm
            onSubmit={handleSubmitProposal}
            draft={draftProposal}
          />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-amber-900 font-serif">
            Your Proposals
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {board?.proposals.map((proposal) =>
              proposal && proposal.status !== "accepted" ? (
                <QuestProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  isGuildMaster={false}
                />
              ) : null,
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
