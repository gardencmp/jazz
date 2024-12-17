import {
  Card,
  CardContainer,
  CardList,
  CardValues,
  Game,
  Player,
  WaitingRoom,
} from "@/schema";
import { startWorker } from "jazz-nodejs";
import { Account, Group, ID } from "jazz-tools";
import { workerCredentials } from "./credentials";
import { StartGameMessage } from "./types";

const { worker } = await startWorker({
  accountID: workerCredentials.accountID,
  accountSecret: workerCredentials.agentSecret,
  onInboxMessage,
  syncServer: "ws://localhost:4200",
});

console.log("Listening for new games on inbox", workerCredentials.accountID);

async function onInboxMessage({ value: id }: StartGameMessage) {
  const waitingRoom = await WaitingRoom.load(id, worker, {});

  if (!waitingRoom?._refs.player1Account) {
    throw new Error("Player 1 account not found");
  }

  if (!waitingRoom?._refs.player2Account) {
    throw new Error("Player 2 account not found");
  }

  await waitingRoom?.ensureLoaded({
    player1Account: {},
    player2Account: {},
  });

  if (!waitingRoom) {
    throw new Error("Failed to load the waiting room");
  }

  if (!waitingRoom.player1Account) {
    throw new Error("Player 1 account not found");
  }

  if (!waitingRoom.player2Account) {
    throw new Error("Player 2 account not found");
  }

  const player1Account = waitingRoom.player1Account;
  const player2Account = waitingRoom.player2Account;

  const readOnlyGroup = Group.create({ owner: worker });
  readOnlyGroup.addMember(player1Account, "reader");
  readOnlyGroup.addMember(player2Account, "reader");

  const p1WriteGroup = Group.create({ owner: worker });
  p1WriteGroup.addMember(player1Account, "writer");
  const p1ReadOnlyGroup = Group.create({ owner: worker });
  p1ReadOnlyGroup.addMember(player1Account, "reader");
  const readOnlyOwnership = { owner: readOnlyGroup };
  const p1WriteOwnership = { owner: p1WriteGroup };
  const p1ReadOnlyOwnership = { owner: p1ReadOnlyGroup };

  const p2WriteGroup = Group.create({ owner: worker });
  p2WriteGroup.addMember(player2Account, "writer");
  const p2ReadOnlyGroup = Group.create({ owner: worker });
  p2ReadOnlyGroup.addMember(player2Account, "reader");
  const p2WriteOwnership = { owner: p2WriteGroup };
  const p2ReadOnlyOwnership = { owner: p2ReadOnlyGroup };

  const deck = CardValues.map((value) =>
    Card.create({ value }, { owner: Group.create({ owner: worker }) }),
  );

  const player1 = Player.create(
    {
      account: player1Account,
      hand: CardList.create([], p1ReadOnlyOwnership),
      scoredCards: CardList.create([], p1ReadOnlyOwnership),
      giocata: CardContainer.create({}, p1WriteOwnership),
    },
    p1ReadOnlyOwnership,
  );

  const player2 = Player.create(
    {
      account: player2Account,
      hand: CardList.create([], p2ReadOnlyOwnership),
      scoredCards: CardList.create([], p2ReadOnlyOwnership),
      giocata: CardContainer.create({}, p2WriteOwnership),
    },
    p2ReadOnlyOwnership,
  );

  const game = Game.create(
    {
      deck: CardList.create(deck, readOnlyOwnership),
      player1,
      player2,
      activePlayer: Math.random() < 0.5 ? player1 : player2,
    },
    readOnlyOwnership,
  );

  waitingRoom.game = game;
  console.log("Starting game", game.id);
  await startGame(game as FullGame);
}

type FullGame = {
  player1: {
    account: Account;
    hand: CardList;
    scoredCards: CardList;
    giocata: CardContainer;
  } & Player;
  player2: {
    account: Account;
    hand: CardList;
    scoredCards: CardList;
    giocata: CardContainer;
  } & Player;
  deck: CardList;
} & Game;

async function startGame(game: FullGame) {
  drawCards(game, "player1");
  drawCards(game, "player2");
}

function drawCards(game: FullGame, playerKey: "player1" | "player2") {
  const player = game[playerKey];
  while (player.hand.length < 3) {
    const card = game.deck.shift();
    if (!card) {
      return;
    }
    const cardGroup = card._owner.castAs(Group);
    cardGroup.addMember(player.account, "reader");
    player.hand.push(card);
  }
}
