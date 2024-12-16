import { CoFeed, CoList, CoMap, co } from "jazz-tools";

export const CardValues = [
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
] as const;

export const CardValue = co.literal(...CardValues);

export class Card extends CoMap {
  value = CardValue;
}

export class CardList extends CoList.Of(co.ref(Card)) {}

export class Player extends CoMap {
  giocata? = co.ref(Card); // write Tavolo - write me - quando un giocatore gioca una carta la scrive qui, il Game la legge, la valida e la mette sul tavolo
  hand = co.ref(CardList); // write Tavolo - read me - quando il Game mi da le carte le scrive qui, quando valida la giocata la toglie da qui
  scoredCards = co.ref(CardList); // write Tavolo - read everyone -
}

export class Game extends CoMap {
  deck = co.ref(CardList);

  // briscola? = co.literal("A", "B", "C", "D");
  //
  // tavolo? = co.ref(Card);

  activePlayer? = co.ref(Player);
  player1 = co.ref(Player);
  player2 = co.ref(Player);
}

// Env: ID e invito publico write only
export class Inbox extends CoFeed.Of(co.ref(Game)) {}
