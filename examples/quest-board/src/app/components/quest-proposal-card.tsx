import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { QuestProposal } from "@/schema";

interface QuestProposalCardProps {
  proposal: QuestProposal;
  isGuildMaster: boolean;
  onApprove?: (proposal: QuestProposal) => void;
  onReject?: (proposal: QuestProposal) => void;
}

export function QuestProposalCard({
  proposal,
  isGuildMaster,
  onApprove,
  onReject,
}: QuestProposalCardProps) {
  return (
    <Card className="w-full max-w-md bg-amber-50 border-2 border-amber-700 shadow-lg">
      <CardHeader className="bg-amber-100 border-b-2 border-amber-700">
        <CardTitle className="text-amber-900 font-serif">
          {proposal.title}
        </CardTitle>
        <Badge
          variant={
            proposal.status === "accepted"
              ? "default"
              : proposal.status === "rejected"
                ? "destructive"
                : "secondary"
          }
          className="font-serif"
        >
          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-amber-800 mb-4 font-serif">
          {proposal.description}
        </p>
      </CardContent>
      {isGuildMaster && proposal.status === "pending" && (
        <CardFooter className="flex justify-between">
          <Button
            onClick={() => onApprove?.(proposal)}
            variant="outline"
            className="border-amber-700 text-amber-900 hover:bg-amber-200"
          >
            Approve
          </Button>
          <Button
            onClick={() => onReject?.(proposal)}
            variant="outline"
            className="border-amber-700 text-amber-900 hover:bg-amber-200"
          >
            Reject
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
