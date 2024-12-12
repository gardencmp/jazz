import { createFileRoute } from "@tanstack/react-router";
import { Reorder, motion } from "motion/react";
import { useState } from "react";
import bastoni from "../../bastoni.svg?url";
import coppe from "../../coppe.svg?url";
import denari from "../../denari.svg?url";
import spade from "../../spade.svg?url";

export const Route = createFileRoute("/game/$gameId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { gameId } = Route.useParams();
  const [cards, setCards] = useState(["A", "B", "C"]);
  const [cards2, setCards2] = useState(["A", "B", "C"]);

  return (
    <div>
      Hello "/game/{gameId}"!
      <Reorder.Group axis="x" values={cards} onReorder={setCards}>
        <div className="flex place-content-center gap-2">
          {cards.map((card) => (
            <Reorder.Item key={card} value={card}>
              <Card card={card} />
            </Reorder.Item>
          ))}
        </div>
      </Reorder.Group>
      <Reorder.Group axis="x" values={cards2} onReorder={setCards2}>
        <div className="flex place-content-center gap-2">
          {cards2.map((card) => (
            <Reorder.Item key={card} value={card}>
              <Card card={card} />
            </Reorder.Item>
          ))}
        </div>
      </Reorder.Group>
    </div>
  );
}

interface Props {
  card: string;
}
function Card({ card }: Props) {
  return (
    <motion.div
      className="border aspect-card w-[150px] bg-white touch-none rounded-lg shadow-lg p-2"
      whileHover={{
        marginTop: -30,
      }}
    >
      <div className="border-zinc-400 border rounded-lg h-full p-2">
        <span className="text-3xl font-bold">7</span>
        <img src={spade} className="h-24 pointer-events-none" />
      </div>
    </motion.div>
  );
}
