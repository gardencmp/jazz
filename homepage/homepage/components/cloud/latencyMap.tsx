import React, { memo, useEffect } from "react";

import * as turf from "@turf/turf";
import type { FeatureCollection, Point, Position } from "geojson";
import land from "./ne_110m_land.json";

import MapTooltip from "./mapTooltip";
// generated with: globalping ping cloud.jazz.tools from world --limit 500 --packets 16 --json | jq "del(.results[].result.rawOutput)" > pings.json
import pings from "./pings.json";

export const LatencyMap = () => {
  return (
    <div className="relative mb-10 -mx-[10rem] -mt-5 rounded-lg">
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

export const MapSVG = memo(({ spacing = 1.5 }: { spacing?: number }) => {
  // Define the data points with their latitudes, longitudes, and ping times
  const serverLocations = [
    {
      city: "Los Angeles",
      lat: 34.0522,
      lng: -118.2437,
      ip: "134.195.91.235",
      color: "hsl(0, 50%, 50%)",
    },
    {
      city: "New York",
      lat: 40.7128,
      lng: -74.006,
      ip: "45.45.219.149",
      color: "hsl(25, 50%, 50%)",
    },
    {
      city: "London",
      lat: 51.5074,
      lng: -0.1278,
      ip: "150.107.201.83",
      color: "hsl(50, 50%, 50%)",
    },
    {
      city: "Singapore",
      lat: 1.3521,
      lng: 103.8198,
      ip: "103.214.23.227",
      color: "hsl(250, 50%, 50%)",
    },
    {
      city: "Sydney",
      lat: -33.8688,
      lng: 151.2153,
      ip: "103.73.65.179",
      color: "hsl(100, 50%, 50%)",
    },
    {
      city: "Tokyo",
      lat: 35.6895,
      lng: 139.7014,
      ip: "103.173.179.181",
      color: "hsl(150, 50%, 50%)",
    },
    {
      city: "Tel Aviv",
      lat: 32.0853,
      lng: 34.7818,
      ip: "64.176.162.228",
      color: "hsl(200, 50%, 50%)",
    },
    {
      city: "Johannesburg",
      lat: -26.2041,
      lng: 28.0473,
      ip: "139.84.228.42",
      color: "hsl(225, 50%, 50%)",
    },
    {
      city: "Vienna",
      lat: 48.2085,
      lng: 16.3721,
      ip: "185.175.59.44",
      color: "hsl(75, 50%, 50%)",
    },
    {
      city: "Sao Paulo",
      lat: -23.5505,
      lng: -46.6333,
      ip: "216.238.99.7",
      color: "hsl(275, 50%, 50%)",
    },
    {
      city: "Dallas",
      lat: 32.7767,
      lng: -96.797,
      ip: "45.32.192.94",
      color: "hsl(300, 50%, 50%)",
    },
  ];

  // create a grid of dots that are green if on land (contained in landOutlines) and blue if not
  const extentX = 720;
  const extentY = 160;
  const grid = new Array(Math.round(extentX / spacing))
    .fill(0)
    .map((_, i) =>
      new Array(Math.round(extentY / spacing))
        .fill(0)
        .map((_, j) => ({ x: i, y: j })),
    );
  // manually add Hawaii by lat/lng
  grid.push([{ x: -155.844437, y: 19.8987 }]);
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
                if (
                  !ping.result.stats ||
                  ping.result.stats.rcv === 0 ||
                  ping.result.stats.avg === null
                )
                  return minDistance;
                const distance = turf.distance(
                  dot.geometry.coordinates,
                  [ping.probe.longitude, ping.probe.latitude],
                  { units: "kilometers" },
                );
                const totalPing =
                  (2 * 1000 * distance) / (0.66 * 299_792) +
                  ping.result.stats.min;

                if (distance < minDistance.dist) {
                  return {
                    city: ping.probe.city,
                    dist: distance,
                    ping: ping.result.stats.min,
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

            return `<circle cx="${
              dot.geometry.coordinates[0] * scaleX + offsetX
            }" cy="${
              -dot.geometry.coordinates[1] * scaleY + offsetY
            }" r="${1.9 * spacing}" fill="${
              pingColorThresholds.find(
                (t) => nearestMeasurement.totalPing < t.ping,
              )?.color
              // serverLocations.find(
              //   (srv) => srv.ip == nearestMeasurement.resolvedAddress,
              // )?.color
            }" data-ping="${nearestMeasurement.totalPing.toFixed(
              1,
            )}ms" data-via="${nearestMeasurement.city + ""}" data-to="${
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
// export const pingColorThresholds = [
//   { ping: 5, color: "hsl(248, 50%, 100%)" },
//   { ping: 10, color: "hsl(248, 50%, 80%)" },
//   { ping: 15, color: "hsl(248, 50%, 72%)" },
//   { ping: 25, color: "hsl(248, 50%, 62%)" },
//   { ping: 35, color: "hsl(248, 50%, 54%)" },
//   { ping: 45, color: "hsl(248, 50%, 49%)" },
//   { ping: 55, color: "hsl(248, 50%, 43%)" },
//   { ping: 65, color: "hsl(248, 50%, 39%)" },
//   { ping: 100, color: "hsl(248, 50%, 35%)" },
//   { ping: 150, color: "hsl(248, 50%, 28%)" },
//   { ping: 200, color: "hsl(248, 50%, 23%)" },
//   { ping: 300, color: "hsl(248, 50%, 20%)" },
//   { ping: 1000, color: "hsl(248, 50%, 16%)" },
// ];

export const pingColorThresholds = [
  { ping: 5, color: "hsl(260,100%,53%)" },
  { ping: 10, color: "hsl(258,95%,56%)" },
  { ping: 15, color: "hsl(256,93%,59%)" },
  { ping: 25, color: "hsl(252,90%,62%)" },
  { ping: 35, color: "hsl(250,88%,65%)" },
  { ping: 45, color: "hsl(245,87%,68%)" },
  { ping: 55, color: "hsl(240,86%,71%)" },
  { ping: 65, color: "hsl(238,84%,74%)" },
  { ping: 100, color: "hsl(235,80%,77%)" },
  { ping: 150, color: "hsl(232,73%,80%)" },
  { ping: 200, color: "hsl(230,69%,83%)" },
  { ping: 300, color: "hsl(230,65%,88%)" },
  { ping: 1000, color: "hsl(220,60%,92%)" },
];
