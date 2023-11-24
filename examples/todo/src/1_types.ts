import { CoMap, CoList, AccountMigration, Profile } from "cojson";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of tasks, lists of tasks and projects
 *  using CoJSON's collaborative map and list types, CoMap & CoList.
 *
 *  CoMap values and CoLists items can contain:
 *  - arbitrary immutable JSON
 *  - references to other CoValues by their CoID
 **/

/** An individual task which collaborators can tick or rename */
export type Task = CoMap<{ done: boolean; text: string }>;

class Task extends co.Map({ done: "boolean", text: "string"}) {}

/** Our top level object: a project with a title, referencing a list of tasks */
class TodoProject extends co.Map({
    title: im.string,
    /** A collaborative, ordered list of tasks */
    tasks: co.List(Task),
}) {}

/** The account root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
class TodoAccountRoot extends co.Map({
    projects: co.List(TodoProject),
}) {}


/** The account migration is run on account creation and on every log-in.
 *  You can use it to set up the account root and any other initial CoValues you need.
 */
export const migration: AccountMigration<Profile, TodoAccountRoot> = (
    account
) => {
    if (!account.root) {
        account.root = new TodoAccountRoot(account, {
            projects: new co.List()
        });
    }
};

/** Walkthrough: Continue with ./2_main.tsx */
