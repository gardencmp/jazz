import { Account, CoList, CoMap, Profile, co } from "jazz-tools";

/** Walkthrough: Defining the data model with CoJSON
 *
 *  Here, we define our main data model of tasks, lists of tasks and projects
 *  using CoJSON's collaborative map and list types, CoMap & CoList.
 *
 *  CoMap values and CoLists items can contain:
 *  - arbitrary immutable JSON
 *  - other CoValues
 **/

/** An individual task which collaborators can tick or rename */
export class Task extends CoMap {
    done = co.boolean;
    text = co.string;
}

export class ListOfTasks extends CoList.Of(co.ref(Task)) {}

/** Our top level object: a project with a title, referencing a list of tasks */
export class TodoProject extends CoMap {
    title = co.string;
    tasks = co.ref(ListOfTasks);
}

export class ListOfProjects extends CoList.Of(co.ref(TodoProject)) {}

/** The account root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export class TodoAccountRoot extends CoMap {
    projects = co.ref(ListOfProjects);
}

export class TodoAccount extends Account {
    profile = co.ref(Profile);
    root = co.ref(TodoAccountRoot);

    /** The account migration is run on account creation and on every log-in.
     *  You can use it to set up the account root and any other initial CoValues you need.
     */
    migrate(creationProps?: { name: string }) {
        super.migrate(creationProps);
        if (!this._refs.root) {
            this.root = TodoAccountRoot.create(
                {
                    projects: ListOfProjects.create([], { owner: this }),
                },
                { owner: this }
            );
        }
    }
}

/** Walkthrough: Continue with ./2_main.tsx */
