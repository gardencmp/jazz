import { cn } from "@/lib/utils";
import { useCoState } from "@/main";
import {
  type Card,
  CardList,
  type CardValue,
  Game,
  type Player,
} from "@/schema";
import { createFileRoute } from "@tanstack/react-router";
import type { ID, co } from "jazz-tools";
import { AnimatePresence, Reorder, motion } from "motion/react";
import { type ReactNode, useState } from "react";
import bastoni from "../../bastoni.svg?url";
import coppe from "../../coppe.svg?url";
import denari from "../../denari.svg?url";
import spade from "../../spade.svg?url";

export const Route = createFileRoute("/game/$gameId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { gameId } = Route.useParams();
  const game = useCoState(Game, gameId as ID<Game>, {
    deck: [{}],
    player1: { hand: [{}], scoredCards: [{}] },
    player2: { hand: [{}], scoredCards: [{}] },
    activePlayer: {},
  });

  // TODO: loading
  if (!game) return null;

  return (
    <div className="flex flex-col h-full p-2 bg-green-800">
      <PlayerArea player={game.player2}>
        <Reorder.Group
          axis="x"
          values={game.player2.hand}
          onReorder={(cards) => {
            // TODO: this is weird AF
            // @ts-expect-error
            game.player2.hand = CardList.create(cards, {
              owner: game.player2.hand._owner,
            });
          }}
        >
          <div className="flex place-content-center gap-2">
            {game.player2.hand.map((card) => (
              <Reorder.Item key={card.value} value={card}>
                <PlayingCard card={card} />
              </Reorder.Item>
            ))}
          </div>
        </Reorder.Group>
      </PlayerArea>

      <div className="grow items-center justify-center flex ">
        <>
          {game.deck[0] && (
            <PlayingCard
              className="rotate-[88deg] left-1/2 absolute"
              card={game.deck[0]}
            />
          )}
          <CardStack cards={game.deck} className="" />
        </>
      </div>

      <PlayerArea player={game.player1}>
        <Reorder.Group
          axis="x"
          values={game.player1.hand}
          onReorder={(cards) => {
            // TODO: this is weird AF
            // @ts-expect-error
            game.player1.hand = CardList.create(cards, {
              owner: game.player1.hand._owner,
            });
          }}
        >
          <div className="flex place-content-center gap-2">
            {game.player1.hand.map((card) => (
              <Reorder.Item key={card.value} value={card}>
                <PlayingCard card={card} />
              </Reorder.Item>
            ))}
          </div>
        </Reorder.Group>
      </PlayerArea>
    </div>
  );
}

interface CardStackProps {
  cards: CardList;
  className?: string;
}
function CardStack({ cards, className }: CardStackProps) {
  return (
    <div className={cn("relative p-4 w-[200px] h-[280px]", className)}>
      <AnimatePresence>
        {cards.map((card, i) => (
          <motion.div
            initial={{ left: -1000 }}
            animate={{ left: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i}
            className="w-[150px] aspect-card absolute border border-gray-200/10 rounded-lg bg-white drop-shadow-sm"
            style={{
              rotate: `${(i % 3) * (i % 5) * 3}deg`,
              backgroundImage: `url(https://placecats.com/150/243)`,
              backgroundSize: "cover",
            }}
          >
            {card?.value}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface Props {
  card: co<Card>;
  className?: string;
}
function PlayingCard({ card, className }: Props) {
  const cardImage = getCardImage(card.value);
  const value = getValue(card.value);

  return (
    <motion.div
      className={cn(
        "border aspect-card w-[150px] bg-white touch-none rounded-lg shadow-lg p-2",
        className,
      )}
    >
      <div className="border-zinc-400 border rounded-lg h-full px-1 flex flex-col ">
        <div className="text-4xl font-bold text-black self-start">{value}</div>
        <div className="grow flex justify-center items-center">
          <img src={cardImage} className="pointer-events-none max-h-[140px]" />
        </div>
        <div className="text-4xl font-bold text-black rotate-180 transform self-end">
          {value}
        </div>
      </div>
    </motion.div>
  );
}

function getCardImage(cardValue: typeof CardValue) {
  switch (cardValue.charAt(0)) {
    case "C":
      return coppe;
    case "D":
      return denari;
    case "S":
      return spade;
    case "B":
      return bastoni;
  }
}

function getValue(card: typeof CardValue) {
  return card.charAt(1);
}

interface PlayerAreaProps {
  player: Player;
  children: ReactNode;
}
function PlayerArea({ children, player }: PlayerAreaProps) {
  return (
    <div className="grid grid-cols-3">
      <div></div>
      {children}
      <div className="flex justify-center">
        <CardStack cards={player.scoredCards} className="rotate-90" />
      </div>
    </div>
  );
}
