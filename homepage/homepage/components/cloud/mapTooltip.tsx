"use client";

import { clsx } from "clsx";
import { useLayoutEffect, useState } from "react";
import { pingColorThresholds } from "./pingColorThresholds";

export default function MapTooltip() {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [circleClass, setCircleClass] = useState("");
  const [text, setText] = useState("");

  useLayoutEffect(() => {
    const onSvgMouseMove = (e: MessageEvent) => {
      if (e.data.type === "svgmouseout") {
        setStyle({ display: "none" });
        return;
      }
      if (e.data.type !== "svgmouseover") return;

      const x = e.data.x;
      const y = e.data.y;
      const ping = e.data.ping;
      const via = e.data.via;
      const to = e.data.to;
      const text = `${ping}ms via ${via} to ${to}`;

      setStyle({
        display: "flex",
        left: `calc(100% * ${x / 1400} + 30px)`,
        top: `calc(100% * ${(y || 0) / 440} + 15px)`,
      });
      setCircleClass(
        "w-3 h-3 rounded-full " +
          (pingColorThresholds.find((t) => t.ping >= ping)?.bgClass || ""),
      );
      setText(text);
    };

    window.addEventListener("message", onSvgMouseMove);

    return () => {
      window.removeEventListener("message", onSvgMouseMove);
    };
  }, []);

  return (
    <>
      <iframe
        className="w-full aspect-[12/4] dark:hidden"
        src="/api/latencyMap?spacing=1.5&dark=false&mouse=true"
      />
      <iframe
        className="w-full aspect-[12/4] hidden dark:block"
        src="/api/latencyMap?spacing=1.5&dark=true&mouse=true"
        style={{ colorScheme: "light" }}
      />
      <div
        className="hidden map-tooltip absolute pointer-events-none text-xs bg-stone-925 text-stone-50 p-2 rounded-lg gap-1 items-center"
        style={style}
      >
        <div className={clsx("w-3 h-3 rounded-full", circleClass)}></div>
        <div className="text-xs">{text}</div>
      </div>
    </>
  );
}
