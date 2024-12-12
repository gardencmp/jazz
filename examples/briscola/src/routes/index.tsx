import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="h-screen flex flex-col w-full place-items-center justify-center p-2">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Welcome to Jazz Briscola</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center space-x-4">
            <div className="w-1/2 flex flex-col p-4">
              <Button>New Game</Button>
            </div>
            <Separator orientation="vertical" className="h-40" />
            <div className="w-1/2 flex flex-col space-y-4 p-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="picture">Game ID</Label>
                <Input id="picture" placeholder="co_XXXXXXXXXXX" />
              </div>
              <Button>Join</Button>
            </div>
          </div>
          <Separator />
          <div className="p-4">
            <Button variant="link">How to play?</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
