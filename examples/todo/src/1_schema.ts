import { Account, CoList, CoMap, Profile, val } from "jazz-tools";

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
export class Task extends CoMap<Task> {
    done = val.boolean;
    text = val.string;
}

export class ListOfTasks extends CoList.Of(val.ref(() => Task)) {}

/** Our top level object: a project with a title, referencing a list of tasks */
export class TodoProject extends CoMap<TodoProject> {
    title = val.string;
    tasks = val.ref(() => ListOfTasks);
}

export class ListOfProjects extends CoList.Of(val.ref(() => TodoProject)) {}

/** The account root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export class TodoAccountRoot extends CoMap<TodoAccountRoot> {
    projects = val.ref(() => ListOfProjects);
}

export class TodoAccount extends Account<TodoAccount> {
    profile = val.ref(() => Profile);
    root = val.ref(() => TodoAccountRoot);

    /** The account migration is run on account creation and on every log-in.
     *  You can use it to set up the account root and any other initial CoValues you need.
     */
    migrate = () => {
        if (!this._refs.root) {
            this.root = new TodoAccountRoot(
                {
                    projects: new ListOfProjects([], { owner: this }),
                },
                { owner: this }
            );
        }
    };
}

/** Walkthrough: Continue with ./2_main.tsx */
