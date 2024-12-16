import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { workerCredentials } from "@/credentials";
import { useAcceptInvite, useAccount, useCoState } from "@/main";
import { WaitingRoom } from "@/schema";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createInviteLink } from "jazz-react";
import { Account, CoFeed, Group, ID, Inbox } from "jazz-tools";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function useInbox() {
  const { me } = useAccount();
  const [inbox, setInbox] = useState<CoFeed<string> | null>(null);
  const [workerAccount, setWorkerAccount] = useState<Account | null>(null);

  useEffect(() => {
    async function loadInbox() {
      if (!me) return;

      const inbox = await Inbox.acceptInvite(workerCredentials.inboxInvite, me);
      setInbox(inbox);
      const workerAccount = await Account.load(
        workerCredentials.accountID,
        me,
        {},
      );
      setWorkerAccount(workerAccount!);
    }

    loadInbox();
  }, [me.id]);

  return useCallback(
    (waitingRoom: WaitingRoom) => {
      if (inbox && workerAccount) {
        const group = waitingRoom._owner.castAs(Group);
        group.addMember(workerAccount, "writer");

        inbox.push(waitingRoom.id);
      }
    },
    [inbox?.id],
  );
}

function HomeComponent() {
  const { me } = useAccount();
  const inbox = useInbox();
  const navigate = useNavigate({ from: "/" });
  const [waitingRoomId, setWaitingRoomId] = useState<
    ID<WaitingRoom> | undefined
  >(undefined);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const waitingRoom = useCoState(WaitingRoom, waitingRoomId, {
    player1Account: {},
    player2Account: {},
  });

  useAcceptInvite({
    invitedObjectSchema: WaitingRoom,
    onAccept: (waitingRoom) => {
      setWaitingRoomId(waitingRoom);
    },
  });

  const onNewGameClick = () => {
    const group = Group.create({ owner: me });
    const waitingRoom = WaitingRoom.create(
      {
        player1Account: me,
        player2Account: null,
      },
      { owner: group },
    );
    setWaitingRoomId(waitingRoom.id);
    setInviteLink(createInviteLink(waitingRoom, "writer"));
  };

  const isPlayer1 = waitingRoom?.player1Account?.id === me.id;
  const hasPlayer2 = !!waitingRoom?.player2Account;

  useEffect(() => {
    if (waitingRoom?.id && !isPlayer1 && !hasPlayer2) {
      waitingRoom.player2Account = me;
    }
  }, [waitingRoom?.id, isPlayer1, hasPlayer2]);

  useEffect(() => {
    if (hasPlayer2 && isPlayer1) {
      inbox(waitingRoom);
    }
  }, [inbox, waitingRoom?.id, hasPlayer2, isPlayer1]);

  useEffect(() => {
    if (waitingRoom?.game) {
      navigate({ to: `/game/${waitingRoom.game.id}` });
    }
  }, [waitingRoom]);

  if (waitingRoom) {
    if (waitingRoom.player2Account) {
      return (
        <div className="h-screen flex flex-col w-full place-items-center justify-center p-2">
          <Card className="w-[500px]">
            <CardHeader>
              <CardTitle>Waiting for game to start</CardTitle>
            </CardHeader>
          </Card>
        </div>
      );
    }

    return (
      <div className="h-screen flex flex-col w-full place-items-center justify-center p-2">
        <Card className="w-[500px]">
          <CardHeader>
            <CardTitle>Waiting for player 2</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center space-x-4">
              <div className="w-1/2 flex flex-col p-4">
                Invite link: <p>{inviteLink}</p>
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

  return (
    <div className="h-screen flex flex-col w-full place-items-center justify-center p-2">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Welcome to Jazz Briscola</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center space-x-4">
            <div className="w-1/2 flex flex-col p-4">
              <Button onClick={onNewGameClick}>New Game</Button>
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
