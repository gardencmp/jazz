import { createFileRoute } from "@tanstack/react-router";
import { Reorder, motion } from "motion/react";
import { useDragControls } from "motion/react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const [cards, setCards] = useState(["A", "B", "C"]);

  return (
    <div className="h-screen flex flex-col w-full justify-between p-2">
      <Reorder.Group axis="x" values={cards} onReorder={setCards}>
        <div className="flex place-content-center gap-2">
          {cards.map((card) => (
            <Reorder.Item key={card} value={card}>
              <Card card={card} />
            </Reorder.Item>
          ))}
        </div>
      </Reorder.Group>

      <Reorder.Group axis="x" values={cards} onReorder={setCards}>
        <div className="flex place-content-center gap-2">
          {cards.map((card) => (
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
  // const controls = useDragControls();

  return (
    <motion.div
      // drag
      // dragControls={controls}
      className="border aspect-card w-[150px] bg-white touch-none rounded-lg shadow-lg p-2"
      whileHover={{
        marginTop: -30,
      }}
    >
      {card}
    </motion.div>
  );
}
