import { useCallback } from "react";

import { CoID, Queried } from "cojson";
import { useTelepathicQuery } from "jazz-react";

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

/** Walkthrough: Reactively rendering a todo project as a table,
 *               adding and editing tasks
 *
 *  Here in `<TodoTable/>`, we use `useTelepathicData()` for the first time,
 *  in this case to load the CoValue for our `TodoProject` as well as
 *  the `ListOfTasks` referenced in it.
 */

export function TodoTable({ projectId }: { projectId: CoID<TodoProject> }) {
    // `useTelepathicData()` reactively subscribes to updates to a CoValue's
    // content - whether we create edits locally, load persisted data, or receive
    // sync updates from other devices or participants!
    const project = useTelepathicQuery(projectId);

    // `createTask` is similar to `createProject` we saw earlier, creating a new CoMap
    // for a new task (in the same group as the list of tasks/the project), and then
    // adding it as an item to the project's list of tasks.
    const createTask = useCallback(
        (text: string) => {
            if (!project?.tasks || !text) return;
            const task = project.group.createMap<Task>({
                done: false,
                text,
            });

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
                        // accounting for the fact that it might not be loaded yet
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
                        // (the only thing we let the user change is the "done" status)
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
                    {task?.edits.text?.by?.profile?.name ? (
                        <span
                            className="rounded-full py-0.5 px-2 text-xs"
                            style={uniqueColoring(task.edits.text.by.id)}
                        >
                            {task.edits.text.by.profile.name}
                        </span>
                    ) : (
                        <Skeleton className="mt-1 w-[50px] h-[1em] rounded-full" />
                    )}
                </div>
            </TableCell>
        </TableRow>
    );
}

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
