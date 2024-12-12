import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { PublicQuest, QuestRating } from "@/schema";

interface QuestCardProps {
  quest: PublicQuest;
  isGuildMaster: boolean;
  onRate?: (quest: PublicQuest, rating: QuestRating) => void;
}

const RATINGS = ["C", "B", "A", "S", "SS"] as const;

export function QuestCard({ quest, isGuildMaster, onRate }: QuestCardProps) {
  return (
    <Card className="w-full max-w-md bg-amber-50 border-2 border-amber-700 shadow-lg">
      <CardHeader className="bg-amber-100 border-b-2 border-amber-700">
        <CardTitle className="text-amber-900 font-serif">
          {quest.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-amber-800 mb-4 font-serif">
          {quest.description}
        </p>
        {quest.rating && (
          <p className="text-sm font-semibold text-amber-900 font-serif">
            Rating: {quest.rating}
          </p>
        )}
      </CardContent>
      {isGuildMaster && !quest.rating && (
        <CardFooter>
          <div className="flex space-x-2">
            {RATINGS.map((rating) => (
              <Button
                key={rating}
                onClick={() => onRate?.(quest, rating)}
                variant="outline"
                className="border-amber-700 text-amber-900 hover:bg-amber-200"
              >
                {rating}
              </Button>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
