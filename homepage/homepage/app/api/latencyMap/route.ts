import * as turf from "@turf/turf";
import type { FeatureCollection, Point, Position } from "geojson";
import { type NextRequest } from "next/server";
import land from "../../../components/cloud/ne_110m_land.json";

// generated with: globalping ping cloud.jazz.tools from world --limit 500 --packets 16 --json | jq "del(.results[].result.rawOutput)" > pings.json
import pings from "../../../components/cloud/pings.json";
import { pingColorThresholds } from "../../../components/cloud/pingColorThresholds";

export const revalidate = 2 * 60 * 60; // 2 hours

export async function GET(req: NextRequest) {
  const spacing = parseFloat(req.nextUrl.searchParams.get("spacing") || "1.5");
  const dark = req.nextUrl.searchParams.get("dark") === "true";
  const addMouseScript = req.nextUrl.searchParams.get("mouse") === "true";

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

  const scaleX = 3;
  const scaleY = 3;
  const offsetX = 600;
  const offsetY = 260;

  const svg = `<svg
      viewBox="0 0 1200 440"
      xmlns="http://www.w3.org/2000/svg"
      >
      <style>
        circle {
          transition: fill 0.2s ease-in-out;
        }
      </style>
      ${dotsOnLand.features
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
            )?.[dark ? "darkFill" : "fill"]
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
        .join("\n")}
      ${
        addMouseScript
          ? `<script>
        document.addEventListener("mousemove", (e) => {
          const target = e.target;

          if (target?.nodeName === "circle") {
            const x = target.cx.baseVal.value;
            const y = target.cy.baseVal.value;
            const ping = parseInt(target.dataset.ping || "0");
            const via = target.dataset.via;
            const to = target.dataset.to;
            const text = \`\${ping}ms via \${via} to \${to}\`;

            window.parent.postMessage({
              type: "svgmouseover",
              x,
              y,
              ping,
              via,
              to,
            }, "*");
          } else {
            window.parent.postMessage({
              type: "svgmouseout",
            }, "*");
          }
        });
      </script>`
          : ""
      }
    </svg>`;

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
