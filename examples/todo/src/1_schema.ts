import {
    AccountMigration,
    CoListOf,
    CoMapOf,
    createAccountMigration,
    imm,
} from "jazz-tools";
import { AccountWith } from "jazz-tools/src/account";

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
export class Task extends CoMapOf({ done: imm.boolean, text: imm.string }) {}

/** Our top level object: a project with a title, referencing a list of tasks */
export class TodoProject extends CoMapOf({
    title: imm.string,
    /** A collaborative, ordered list of tasks */
    tasks: CoListOf(Task),
}) {}

/** The account root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user */
export class TodoAccountRoot extends CoMapOf({
    projects: CoListOf(TodoProject),
}) {}

export class TodoAccount extends AccountWith(
    CoMapOf({ name: imm.string }),
    TodoAccountRoot
) {}

/** The account migration is run on account creation and on every log-in.
 *  You can use it to set up the account root and any other initial CoValues you need.
 */
export const migration = createAccountMigration(TodoAccount, (account) => {
    if (!account.root) {
        account.root = new TodoAccountRoot(
            {
                projects: new (CoListOf(TodoProject))([], { owner: account }),
            },
            { owner: account }
        );
    }
});

/** Walkthrough: Continue with ./2_main.tsx */
