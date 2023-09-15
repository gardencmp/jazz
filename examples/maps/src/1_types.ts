import { CoMap, CoStream, Media, CoList } from "cojson";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of TODO
 *
 *  TODO
 **/

export type MapSpace = CoMap<{
    name: string;
    positions: PeoplePositions;
    notes: MapNotes;
}>;

export type PeoplePositions = CoStream<{latitude: number, longitude: number, accuracy: number}>;

export type MapNotes = CoList<MapNote>;

export type MapNote = CoMap<{
    message?: string;
    image?: Media.ImageDefinition;
}>;

/** Walkthrough: Continue with ./2_App.tsx */
