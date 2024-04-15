import { Co, Profile } from "jazz-tools";

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
export class Task extends Co.Map<Task> {
    declare done: boolean;
    declare text: string;
}
Task.encoding({ done: "json", text: "json" });

export class ListOfTasks extends Co.List<Task | null> {}
ListOfTasks.encoding({ _item: { ref: () => Task } });

/** Our top level object: a project with a title, referencing a list of tasks */
export class TodoProject extends Co.Map<TodoProject> {
    declare title: string;
    /** A collaborative, ordered list of tasks */
    declare tasks: ListOfTasks | null;
}
TodoProject.encoding({ title: "json", tasks: { ref: () => ListOfTasks } });

export class ListOfProjects extends Co.List<TodoProject | null> {}
ListOfProjects.encoding({ _item: { ref: () => TodoProject } });

/** The account root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export class TodoAccountRoot extends Co.Map<TodoAccountRoot> {
    declare projects: ListOfProjects | null;
}
TodoAccountRoot.encoding({ projects: { ref: () => ListOfProjects } });

export class TodoAccount extends Co.Account<TodoAccount> {
    declare profile: Profile;
    declare root: TodoAccountRoot | null;

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
TodoAccount.encoding({
    profile: { ref: () => Profile },
    root: { ref: () => TodoAccountRoot },
});

/** Walkthrough: Continue with ./2_main.tsx */
