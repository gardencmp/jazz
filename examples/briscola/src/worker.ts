import { Card, CardList, CardValues, Game, Player } from "@/schema";
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

  for (let i = 0; i < 3; i++) {
    const card = deck.pop();
    if (card) {
      // TODO: set permission of the card to read-only player1
      player2.hand?.push(card);
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
      scoredCards: CardList.create([], {
        owner,
      }),
      // giocata: null,
      hand: CardList.create([], { owner }),
    },
    { owner },
  );

  return player;
}

function createDeck({ owner }: { owner: Group }) {
  const cards = [...CardValues];

  shuffle(cards);

  const deck = CardList.create(
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
