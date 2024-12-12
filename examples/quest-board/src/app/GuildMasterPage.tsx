import { useAccount } from "@/app";
import { PublicQuest, QuestProposal, QuestRating } from "@/schema";
import { createInviteLink } from "jazz-react";
import { QuestCard } from "./components/quest-card";
import { QuestProposalCard } from "./components/quest-proposal-card";

export default function GuildMasterPage() {
  const { me } = useAccount({
    root: {
      publicQuests: [{}],
      proposals: [{}],
    },
  });
  const board = me?.root;
  const proposals = board?.proposals;
  const publicQuests = board?.publicQuests;
  const publicGroup = board?._owner;

  const handleApprove = (proposal: QuestProposal) => {
    if (!publicGroup || !publicQuests) return;

    const author = proposal._owner.profile;

    const publicQuest = PublicQuest.create(
      {
        title: proposal.title,
        description: proposal.description,
        proposal,
        author,
      },
      { owner: publicGroup },
    );

    proposal.status = "accepted";
    proposal.publicQuest = publicQuest;

    publicQuests.push(publicQuest);
  };

  const handleReject = (proposal: QuestProposal) => {
    proposal.status = "rejected";
  };

  const handleRate = (quest: PublicQuest, rating: QuestRating) => {
    quest.rating = rating;
  };

  const handleShare = async () => {
    if (!proposals) return;

    const invite = createInviteLink(proposals, "writeOnly");

    const url = new URL(invite);
    url.searchParams.set("board", board.id);

    await proposals._owner.waitForSync();

    navigator.clipboard.writeText(url.toString());
    alert(`Invite link copied to clipboard`);
  };

  return (
    <div className="min-h-screen bg-[url('/parchment-background.jpg')] bg-cover bg-center">
      <main className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-amber-900 font-serif">
          Guild Master's Quarters
        </h1>
        <div className="mb-8 text-center">
          <button
            className="bg-amber-700 text-amber-100 px-6 py-3 rounded-full hover:bg-amber-800 transition-colors font-semibold text-lg shadow-lg"
            onClick={handleShare}
          >
            Share
          </button>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-amber-900 font-serif">
            Available Quests
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publicQuests?.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                isGuildMaster={true}
                onRate={handleRate}
              />
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-amber-900 font-serif">
            Quest Proposals Awaiting Review
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {proposals?.map((proposal) =>
              proposal.status === "pending" ? (
                <QuestProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  isGuildMaster={true}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ) : null,
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
