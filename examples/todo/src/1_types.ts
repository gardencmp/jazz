import { CoMap, CoList, CoID } from "cojson";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of tasks, lists of tasks and projects
 *  using CoJSON's collaborative map and list types, CoMap & CoList.
 *
 *  CoMap values and CoLists items can be:
 *  - arbitrary immutable JSON
 *  - references to other CoValues by their CoID
 *    - CoIDs are strings that look like `co_zXPuWmH1D1cKdMpDW6CMzWb3LpY`
 *    - In TypeScript, CoIDs take a generic parameter for the type of the
 *      referenced CoValue, e.g. `CoID<Task>` - to make the references precise
 **/

/** An individual task which collaborators can tick or rename */
export type Task = CoMap<{ done: boolean; text: string; }>;

/** A collaborative, ordered list of task references */
export type ListOfTasks = CoList<CoID<Task>>;

/** Our top level object: a project with a title, referencing a list of tasks */
export type TodoProject = CoMap<{
    title: string;
    tasks: CoID<ListOfTasks>;
}>;

/** Walkthrough: Continue with ./2_App.tsx */