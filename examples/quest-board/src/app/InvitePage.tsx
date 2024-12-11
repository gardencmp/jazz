import { useAcceptInvite } from "@/app";
import { QuestBoard, QuestProposals } from "@/schema";
import { ID } from "jazz-tools";

export default function InvitePage({
  onAcceptInvite,
}: { onAcceptInvite: (boardId: ID<QuestBoard>) => void }) {
  useAcceptInvite({
    invitedObjectSchema: QuestProposals,
    onAccept: () => {
      const boardId = new URL(window.location.href).searchParams.get("board");
      if (!boardId) return;

      onAcceptInvite(boardId as ID<QuestBoard>);
    },
  });

  return null;
}
