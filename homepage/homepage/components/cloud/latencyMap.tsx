import { clsx } from "clsx";
import MapTooltip from "./mapTooltip";
import { pingColorThresholds } from "./pingColorThresholds";

export const LatencyMap = () => {
  return (
    <div className="mb-4 rounded-lg relative">
      <div className="relative xl:-mx-[10%] xl:w-[120%] aspect-[12/4]">
        <MapTooltip />
      </div>
      <div className="absolute bottom-0 left-0 lg:bottom-8 flex flex-col md:gap-1">
        {pingColorThresholds.map((t, i) => (
          <div
            key={t.ping}
            className={clsx("flex items-center gap-1", {
              "hidden sm:flex": i % 2 !== 0,
            })}
          >
            <div className={"size-2 md:size-3 rounded-full " + t.bgClass}></div>
            <div className="text-[9px] md:text-xs font-mono">
              &lt;{t.ping}ms
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
