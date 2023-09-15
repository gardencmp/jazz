import { useTelepathicQuery } from "jazz-react";

import { MapSpace } from "./1_types";

import { ShareButton } from "./components/ShareButton";
import Map, { CircleLayer, Layer, Source } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState } from "react";
import { Button } from "./basicComponents";
import uniqolor from "uniqolor";

/** Walkthrough: TODO
 */

export function MapView({ mapID }: { mapID: MapSpace["id"] }) {
    const mapSpace = useTelepathicQuery(mapID);

    const [consent, setConsent] = useState(false);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between">
                <h1 className="text-3xl font-bold">{mapSpace?.name}</h1>
                <ShareButton mapSpace={mapSpace} />
            </div>
            {consent ? (
                <Map
                    mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                    initialViewState={{
                        ...(mapSpace?.positions?.me?.last
                            ? {
                                  latitude: mapSpace.positions.me.last.latitude,
                                  longitude:
                                      mapSpace.positions.me.last.longitude,
                              }
                            : {
                                  latitude: 0,
                                  longitude: 0,
                              }),
                        zoom: 10,

                    }}
                    style={{ width: 600, height: 400 }}
                    mapStyle="mapbox://styles/mapbox/streets-v9"
                >
                    <Source
                        id="my-data"
                        type="geojson"
                        data={{
                            type: "FeatureCollection",
                            features:
                                Object.values(mapSpace?.positions?.perAccount || {}).flatMap((accountEntry) =>
                                accountEntry.all.map((position, i, all) => ({
                                        type: "Feature",
                                        geometry: {
                                            type: "Point",
                                            coordinates: [
                                                position.value.longitude,
                                                position.value.latitude,
                                            ],
                                        },
                                        properties: {
                                            accuracy: position.value.accuracy,
                                            lat: position.value.latitude,
                                            color: uniqolor(accountEntry.by?.id || "").color,
                                            opacity: i === all.length - 1 ? 1 : 0.1,
                                        },
                                    }))
                                ) || [],
                        }}
                    >
                        <Layer
                            {...({
                                id: "point",
                                type: "circle",
                                paint: {
                                    // "circle-radius": ["get", "accuracy"],
                                    "circle-radius": [
                                        'interpolate',
                                        ['exponential', 2],
                                        ['zoom'],
                                        0, 0,
                                        20, [
                                          '/',
                                          ['/', ["get", "accuracy"], 0.075],
                                          ['cos', ['*', ['get', 'lat'], ['/', Math.PI, 180]]],
                                        ],
                                      ],
                                    "circle-stroke-color": ['get', 'color'],
                                    "circle-stroke-width": 1,
                                    "circle-color": "transparent",
                                    "circle-stroke-opacity": ['get', 'opacity'],
                                },
                            } satisfies CircleLayer)}
                        />
                        <Layer
                            {...({
                                id: "point2",
                                type: "circle",
                                paint: {
                                    // "circle-radius": ["get", "accuracy"],
                                    "circle-radius": 4,
                                    "circle-color": ['get', 'color'],
                                    "circle-opacity": ['get', 'opacity'],
                                },
                            } satisfies CircleLayer)}
                        />
                    </Source>
                </Map>
            ) : (
                mapSpace?.positions && (
                    <Button
                        onClick={() => {
                            navigator.geolocation.watchPosition(
                                (position) => {
                                    setConsent(true);
                                    console.log(position);
                                    mapSpace?.positions?.edit((positions) => {
                                        positions.push({
                                            latitude: position.coords.latitude,
                                            longitude:
                                                position.coords.longitude,
                                            accuracy: position.coords.accuracy,
                                        });
                                    });
                                },
                                (error) => {
                                    console.error(error);
                                },
                                {
                                    enableHighAccuracy: true,
                                }
                            );
                        }}
                    >
                        Allow Location Access
                    </Button>
                )
            )}
        </div>
    );
}
