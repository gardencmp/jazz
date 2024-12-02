"use client";

import { useEffect } from "react";
import { pingColorThresholds } from "./latencyMap";

export default function MapTooltip() {
  useEffect(() => {
    // register callback for hovering, if we're over any circle, show the tooltip based on the data attributes
    const onMouseMove = (e: MouseEvent) => {
      const circ = e.target;
      console.log(circ);

      const el = document.querySelector(
        ".map-tooltip",
      ) as HTMLDivElement | null;
      if (!el) return;

      if (circ instanceof SVGCircleElement) {
        const x = circ.cx.baseVal.value;
        const y = circ.cy.baseVal.value;
        const ping = parseInt(circ.dataset.ping || "0");
        const via = circ.dataset.via;
        const to = circ.dataset.to;
        const text = `${ping}ms via ${via} to ${to}`;

        el.style.display = "flex";

        el.style.left = `calc(100% * ${x / 1400} + 30px)`;
        el.style.top = `calc(100% * ${(y || 0) / 440} + 15px)`;
        (el.children[0] as HTMLDivElement).style.backgroundColor =
          pingColorThresholds.find((t) => t.ping >= ping)?.color || "";
        (el.children[1] as HTMLDivElement).textContent = text;
      } else {
        el.style.display = "none";
      }
    };

    console.log("registering");

    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <div className="map-tooltip absolute pointer-events-none text-xs bg-stone-925 text-stone-50 p-2 rounded-lg gap-1 items-center">
      <div className="w-3 h-3 rounded-full"></div>
      <div className="text-xs"></div>
    </div>
  );
}
