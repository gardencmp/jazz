import React, { memo, useEffect } from "react";

import land from "./ne_110m_land.json";
import * as turf from "@turf/turf";
import type { FeatureCollection, Point, Position } from "geojson";

// generated with globalping ping cloud.jazz.tools from world --limit 50 --json > pings.json
import pings from "./pings.json";
import MapTooltip from "./mapTooltip";

const PingMap = () => {
  return (
    <div className="relative mb-10 -mx-[10rem] -mt-5 bg-stone-950 rounded-lg">
      <MapSVG />
      <MapTooltip />
      <div className="absolute bottom-4 left-[10rem] flex flex-col gap-1">
        {pingColorThresholds.map((t) => (
          <div key={t.ping} className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded-full"
              style={{ background: t.color }}
            ></div>
            <div className="text-xs font-mono">&lt;{t.ping}ms</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MapSVG = memo(() => {
  // Define the data points with their latitudes, longitudes, and ping times
  const serverLocations = [
    {
      city: "LosAngeles",
      lat: 34.0522,
      lng: -118.2437,
      ip: "134.195.91.235",
      color: "hsl(0, 50%, 50%)",
    },
    {
      city: "NewYork",
      lat: 40.7128,
      lng: -74.006,
      ip: "45.45.219.149",
      color: "hsl(100, 50%, 50%)",
    },
    {
      city: "London",
      lat: 51.5074,
      lng: -0.1278,
      ip: "150.107.201.83",
      color: "hsl(200, 50%, 50%)",
    },
    {
      city: "Singapore",
      lat: 1.3521,
      lng: 103.8198,
      ip: "103.214.23.227",
      color: "hsl(300, 50%, 50%)",
    },
  ];

  // create a grid of dots that are green if on land (contained in landOutlines) and blue if not
  const extentX = 720;
  const extentY = 160;
  const spacing = 1.5;
  const grid = new Array(Math.round(extentX / spacing))
    .fill(0)
    .map((_, i) =>
      new Array(Math.round(extentY / spacing))
        .fill(0)
        .map((_, j) => ({ x: i, y: j })),
    );
  const dots = grid.flatMap((row) =>
    row.map(({ x, y }) => ({
      x: -450 + x * spacing + ((y % 2) * spacing) / 2,
      y: -60 + y * spacing,
    })),
  );
  const landPolygon = turf.multiPolygon(
    land.geometries.map((g) => g.coordinates),
  );
  const dotsOnLand = turf.pointsWithinPolygon(
    turf.points(dots.map((d) => [d.x, d.y])),
    landPolygon,
  ) as FeatureCollection<Point>;

  console.log(dotsOnLand.features[0].geometry);

  const scaleX = 3;
  const scaleY = 3;
  const offsetX = 600;
  const offsetY = 260;

  return (
    <svg
      viewBox="0 0 1200 440"
      className="mx-auto"
      dangerouslySetInnerHTML={{
        __html: dotsOnLand.features
          .map((dot, index) => {
            const nearestMeasurement = pings.results.reduce(
              (minDistance, ping) => {
                const distance = turf.distance(
                  dot.geometry.coordinates,
                  [ping.probe.longitude, ping.probe.latitude],
                  { units: "kilometers" },
                );
                const totalPing =
                  (2 * 1000 * distance) / (0.66 * 299_792) +
                  ping.result.stats.avg;

                if (distance < minDistance.dist) {
                  return {
                    city: ping.probe.city,
                    dist: distance,
                    ping: ping.result.stats.avg,
                    totalPing,
                    resolvedAddress: ping.result.resolvedAddress,
                  };
                }
                return minDistance;
              },
              {
                city: "",
                dist: Infinity,
                ping: Infinity,
                totalPing: Infinity,
                resolvedAddress: "",
              },
            );

            // fill=${
            //   serverLocations.find(
            //     (srv) => srv.ip == nearestMeasurement.resolvedAddress,
            //   )?.color
            // }
            return `<circle cx="${
              dot.geometry.coordinates[0] * scaleX + offsetX
            }" cy="${
              -dot.geometry.coordinates[1] * scaleY + offsetY
            }" r="${4.2 / spacing}" fill="${
              pingColorThresholds.find(
                (t) => nearestMeasurement.totalPing < t.ping,
              )?.color
            }" data-ping="${
              nearestMeasurement.totalPing.toFixed(1)
            }ms" data-via="${
              nearestMeasurement.city + ""
            }" data-to="${
              serverLocations.find(
                (srv) => srv.ip == nearestMeasurement.resolvedAddress,
              )?.city
            }"/>`;
          })
          .join("\n"),
      }}
    />
  );
});

// dark mode
export const pingColorThresholds = [
  { ping: 5, color: "hsl(244, 50%, 100%)" },
  { ping: 10, color: "hsl(244, 50%, 80%)" },
  { ping: 15, color: "hsl(244, 50%, 70%)" },
  { ping: 25, color: "hsl(244, 50%, 60%)" },
  { ping: 35, color: "hsl(244, 50%, 52%)" },
  { ping: 45, color: "hsl(244, 50%, 40%)" },
  { ping: 55, color: "hsl(244, 50%, 30%)" },
  { ping: 65, color: "hsl(244, 50%, 25%)" },
  { ping: 100, color: "hsl(244, 50%, 22%)" },
  { ping: 200, color: "hsl(244, 50%, 19%)" },
  { ping: 300, color: "hsl(244, 50%, 16%)" },
  { ping: 1000, color: "hsl(244, 50%, 13%)" },
];

// export const pingColorThresholds = [
//   { ping: 5, color: "hsl(244, 100%, 50%)" },
//   { ping: 10, color: "hsl(244, 90%, 55%)" },
//   { ping: 15, color: "hsl(244, 80%, 56%)" },
//   { ping: 25, color: "hsl(244, 70%, 57%)" },
//   { ping: 35, color: "hsl(244, 65%, 58%)" },
//   { ping: 45, color: "hsl(244, 60%, 59%)" },
//   { ping: 55, color: "hsl(244, 55%, 63%)" },
//   { ping: 65, color: "hsl(244, 50%, 69%)" },
//   { ping: 100, color: "hsl(244, 45%, 73%)" },
//   { ping: 200, color: "hsl(244, 40%, 78%)" },
//   { ping: 300, color: "hsl(244, 35%, 82%)" },
//   { ping: 1000, color: "hsl(244, 30%, 85%)" },
// ];

export default PingMap;
