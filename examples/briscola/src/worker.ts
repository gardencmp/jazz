import { Card, CardValue, Game, ListaDiCarte, Player } from "@/schema";
import { startWorker } from "jazz-nodejs";
import { Group } from "jazz-tools";

const { worker } = await startWorker({
  // AccountSchema: MyWorkerAccount,
  syncServer: "wss://cloud.jazz.tools/?key=you@example.com",
});

function createGame() {
  const everyoneWriter = Group.create({ owner: worker });
  everyoneWriter.addMember("everyone", "writer");

  const player1 = createPlayer({ owner: everyoneWriter });
  const player2 = createPlayer({ owner: everyoneWriter });

  const deck = createDeck({ owner: everyoneWriter });

  for (let i = 0; i < 3; i++) {
    const card = deck.pop();
    if (card) {
      // TODO: set permission of the card to read-only player1
      player1.hand?.push(card);
    }
  }

  const newGame = Game.create(
    {
      deck,
      activePlayer: player1,
      player1: player1,
      player2: player2,
    },
    { owner: everyoneWriter },
  );

  return newGame.id;
}

interface CreatePlayerParams {
  owner: Group;
}
function createPlayer({ owner }: CreatePlayerParams) {
  const player = Player.create(
    {
      carteAcchiappate: ListaDiCarte.create([], {
        owner,
      }),
      // giocata: null,
      hand: ListaDiCarte.create([], { owner }),
    },
    { owner: worker },
  );

  return player;
}

function createDeck({ owner }: { owner: Group }) {
  const cards = [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8",
    "S9",
    "S10",
    "C1",
    "C2",
    "C3",
    "C4",
    "C5",
    "C6",
    "C7",
    "C8",
    "C9",
    "C10",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5",
    "D6",
    "D7",
    "D8",
    "D9",
    "D10",
    "B1",
    "B2",
    "B3",
    "B4",
    "B5",
    "B6",
    "B7",
    "B8",
    "B9",
    "B10",
  ];

  shuffle(cards);

  const deck = ListaDiCarte.create(
    cards.map((card) => {
      return Card.create({ value: card }, { owner });
    }),
    { owner },
  );

  return deck;
}

// Fisher–Yates shuffle
function shuffle(array: string[]) {
  let currentIndex = array.length;

  while (currentIndex != 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}

const gameId = createGame();
console.log("Game created with id:", gameId);
