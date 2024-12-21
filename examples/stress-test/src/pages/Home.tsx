import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { useAccount } from "../jazz";
import { addTasks } from "../schema";

export function HomePage() {
  const { me } = useAccount({
    root: {
      tasks: [],
    },
  });

  const tasks = me?.root.tasks ?? [];

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  return (
    <>
      <div>
        <button onClick={() => me?.root.tasks && addTasks(me.root.tasks)}>
          Add Tasks
        </button>
      </div>
      <div
        ref={parentRef}
        style={{
          height: `100vh`,
          overflow: "auto", // Make it scroll!
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {tasks[virtualItem.index]?.title}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
