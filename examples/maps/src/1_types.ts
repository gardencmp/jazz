import { CoMap, CoID, CoStream, Media, CoList } from "cojson";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of TODO
 *
 *  TODO
 **/

export type MapSpace = CoMap<{
    name: string;
    positions: Positions["id"];
    notes: MapNotes["id"];
}>;

export type Positions = CoStream<[number, number]>;

export type MapNotes = CoList<MapNote["id"]>;

export type MapNote = CoMap<{
    message?: string;
    image?: Media.ImageDefinition["id"];
}>;

/** Walkthrough: Continue with ./2_App.tsx */
