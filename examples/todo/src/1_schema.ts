import { BaseProfile, Co, S, AccountMigration } from "jazz-tools";

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
export class Task extends Co.map({
    done: S.boolean,
    text: S.string,
}).as<Task>() {}

export class ListOfTasks extends Co.list(Task).as<ListOfTasks>() {}

/** Our top level object: a project with a title, referencing a list of tasks */
export class TodoProject extends Co.map({
    title: S.string,
    /** A collaborative, ordered list of tasks */
    tasks: ListOfTasks,
}).as<TodoProject>() {}

export class ListOfProjects extends Co.list(TodoProject).as<ListOfProjects>() {}

/** The account root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export class TodoAccountRoot extends Co.map({
    projects: ListOfProjects,
}).as<TodoAccountRoot>() {}

export class TodoAccount extends Co.account({
    profile: BaseProfile,
    root: TodoAccountRoot,
}).as<TodoAccount>() {}

/** The account migration is run on account creation and on every log-in.
 *  You can use it to set up the account root and any other initial CoValues you need.
 */
export const migration: AccountMigration<typeof TodoAccount> = (me) => {
    if (!me._refs.root) {
        me.root = new TodoAccountRoot(
            {
                projects: new ListOfProjects([], { owner: me }),
            },
            { owner: me }
        );
    }
};

/** Walkthrough: Continue with ./2_main.tsx */
