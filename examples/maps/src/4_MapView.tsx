import { useTelepathicState } from "jazz-react";

import { MapSpace } from "./1_types";

import { ShareButton } from "./components/ShareButton";
import Map from "react-map-gl";
import { useEffect } from "react";

/** Walkthrough: TODO
 */

export function MapView({ mapID }: { mapID: MapSpace["id"] }) {
    const mapSpace = useTelepathicState(mapID);

    useEffect(() => {
        navigator.geolocation.watchPosition((position) => {
            console.log(position)
        }, (error) => {
            console.error(error)
        }, {
            enableHighAccuracy: true,
        })
    }, [])

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between">
                <h1 className="text-3xl font-bold">{mapSpace?.get("name")}</h1>
                <ShareButton petPost={mapSpace} />
            </div>
            <Map
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                initialViewState={{
                    longitude: -122.4,
                    latitude: 37.8,
                    zoom: 14,
                }}
                style={{ width: 600, height: 400 }}
                mapStyle="mapbox://styles/mapbox/streets-v9"
            />
        </div>
    );
}
