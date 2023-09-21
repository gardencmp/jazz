import { useCallback } from "react";

import { CoID, Queried } from "cojson";
import { useSyncedQuery } from "jazz-react";

import { TodoProject, Task } from "./1_types";

import {
    Checkbox,
    SubmittableInput,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./basicComponents";

import { InviteButton } from "./components/InviteButton";
import uniqolor from "uniqolor";
import { useParams } from "react-router";

/** Walkthrough: Reactively rendering a todo project as a table,
 *               adding and editing tasks
 *
 *  Here in `<TodoTable/>`, we use `useSyncedData()` for the first time,
 *  in this case to load the CoValue for our `TodoProject` as well as
 *  the `ListOfTasks` referenced in it.
 */

export function ProjectTodoTable() {
    const projectId = useParams<{ projectId: CoID<TodoProject> }>().projectId;

    // `useSyncedData()` reactively subscribes to updates to a CoValue's
    // content - whether we create edits locally, load persisted data, or receive
    // sync updates from other devices or participants!
    // It also recursively resolves and subsribes to all referenced CoValues.
    const project = useSyncedQuery(projectId);

    // `createTask` is similar to `createProject` we saw earlier, creating a new CoMap
    // for a new task (in the same group as the project), and then
    // adding that as an item to the project's list of tasks.
    const createTask = useCallback(
        (text: string) => {
            if (!project?.tasks || !text) return;
            const task = project.group.createMap<Task>({
                done: false,
                text,
            });

            // project.tasks is immutable, but `append` will create an edit
            // that will cause useSyncedQuery to rerender this component
            // - here and on other devices!
            project.tasks.append(task);
        },
        [project?.tasks, project?.group]
    );

    return (
        <div className="max-w-full w-4xl">
            <div className="flex justify-between items-center gap-4 mb-4">
                <h1>
                    {
                        // This is how we can access properties from the project query,
                        // accounting for the fact that note everything might be loaded yet
                        project?.title ? (
                            <>
                                {project.title}{" "}
                                <span className="text-sm">({project.id})</span>
                            </>
                        ) : (
                            <Skeleton className="mt-1 w-[200px] h-[1em] rounded-full" />
                        )
                    }
                </h1>
                <InviteButton value={project} />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">Done</TableHead>
                        <TableHead>Task</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {project?.tasks?.map(
                        (task) => task && <TaskRow key={task.id} task={task} />
                    )}
                    <NewTaskInputRow
                        createTask={createTask}
                        disabled={!project}
                    />
                </TableBody>
            </Table>
        </div>
    );
}

export function TaskRow({ task }: { task: Queried<Task> | undefined }) {
    return (
        <TableRow>
            <TableCell>
                <Checkbox
                    className="mt-1"
                    checked={task?.done}
                    onCheckedChange={(checked) => {
                        // Tick or untick the task
                        // Task is also immutable, but this will update all queries
                        // that include this task as a reference
                        task?.set({ done: !!checked });
                    }}
                />
            </TableCell>
            <TableCell>
                <div className="flex flex-row justify-between items-center gap-2">
                    {task?.text ? (
                        <span className={task?.done ? "line-through" : ""}>
                            {task.text}
                        </span>
                    ) : (
                        <Skeleton className="mt-1 w-[200px] h-[1em] rounded-full" />
                    )}
                    {
                        // Here we see for the first time how we can access edit history
                        // for a CoValue, and use it to display who created the task.
                        task?.edits.text?.by?.profile?.name ? (
                            <span
                                className="rounded-full py-0.5 px-2 text-xs"
                                style={uniqueColoring(task.edits.text.by.id)}
                            >
                                {task.edits.text.by.profile.name}
                            </span>
                        ) : (
                            <Skeleton className="mt-1 w-[50px] h-[1em] rounded-full" />
                        )
                    }
                </div>
            </TableCell>
        </TableRow>
    );
}

/** Walkthrough: This is the end of the walkthrough so far! */

function NewTaskInputRow({
    createTask,
    disabled,
}: {
    createTask: (text: string) => void;
    disabled: boolean;
}) {
    return (
        <TableRow>
            <TableCell>
                <Checkbox className="mt-1" disabled />
            </TableCell>
            <TableCell>
                <SubmittableInput
                    onSubmit={(taskText) => createTask(taskText)}
                    label="Add"
                    placeholder="New task"
                    disabled={disabled}
                />
            </TableCell>
        </TableRow>
    );
}

function uniqueColoring(seed: string) {
    const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

    return {
        color: uniqolor(seed, { lightness: darkMode ? 80 : 20 }).color,
        background: uniqolor(seed, { lightness: darkMode ? 20 : 80 }).color,
    };
}
