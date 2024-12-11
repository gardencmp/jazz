import { Account, CoList, CoMap, Group, Profile, co } from "jazz-tools";

export class QuestProposalDraft extends CoMap {
  title = co.optional.string;
  description = co.optional.string;
}

export class QuestProposal extends CoMap {
  title = co.string;
  description = co.string;
  status = co.json<"rejected" | "accepted" | "pending">();
  publicQuest = co.optional.ref(PublicQuest);
}

export type QuestRating = "C" | "B" | "A" | "S" | "SS";

export class PublicQuest extends CoMap {
  title = co.string;
  description = co.string;
  proposal = co.ref(QuestProposal);
  rating = co.optional.json<QuestRating>();
  author = co.optional.ref(Profile);
}

export class QuestProposals extends CoList.Of(co.ref(QuestProposal)) {}
export class PublicQuests extends CoList.Of(co.ref(PublicQuest)) {}

export class QuestBoard extends CoMap {
  proposals = co.ref(QuestProposals);
  publicQuests = co.ref(PublicQuests);
  draftProposal = co.optional.ref(QuestProposalDraft);
}

export class QuestBoardAccount extends Account {
  profile = co.ref(Profile);
  root = co.ref(QuestBoard);

  async migrate(creationProps?: { name: string }) {
    super.migrate(creationProps);

    if (!this._refs.root) {
      const publicOwnership = { owner: Group.create({ owner: this }) };
      const proposalsOwnership = { owner: Group.create({ owner: this }) };

      publicOwnership.owner.addMember("everyone", "reader");

      this.root = QuestBoard.create(
        {
          proposals: QuestProposals.create([], proposalsOwnership),
          publicQuests: PublicQuests.create([], publicOwnership),
        },
        publicOwnership,
      );
    }
  }
}
