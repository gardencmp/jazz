import { useAccount } from "@/app";
import { QuestProposalDraft } from "@/schema";
import { useEffect } from "react";

export function useQuestProposalDraft() {
  const { me } = useAccount({
    root: {
      draftProposal: {},
    },
  });

  useEffect(() => {
    if (!me?.root) return;
    if (me.root.draftProposal) return;

    me.root.draftProposal = QuestProposalDraft.create({}, { owner: me });
  }, [me?.root]);

  function clearDraftProposal() {
    if (!me?.root) return;
    if (!me.root.draftProposal) return;

    // @ts-expect-error We should accept null values and reject undefined values
    me.root.draftProposal = null;
  }

  return {
    draftProposal: me?.root.draftProposal,
    clearDraftProposal,
  };
}
