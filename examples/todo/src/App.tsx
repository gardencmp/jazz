import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { CoMap, CoID, AccountID } from "cojson";
import { useJazz, useProfile, useTelepathicState } from "jazz-react";
import { SubmittableInput } from "./components/SubmittableInput";

type TaskContent = { done: boolean; text: string };
type Task = CoMap<TaskContent>;

type TodoListContent = {
    title: string;
    // other keys form a set of task IDs
    [taskId: CoID<Task>]: true
};
type TodoList = CoMap<TodoListContent>;

function App() {
    const [listId, setListId] = useState<CoID<TodoList>>(
        window.location.hash.slice(1) as CoID<TodoList>
    );

    const { localNode, logOut } = useJazz();

    const createList = useCallback((title: string) => {
        const listTeam = localNode.createTeam();
        const list = listTeam.createMap<TodoListContent>();

        list.edit((list) => {
            list.set("title", title);
        });

        window.location.hash = list.id;
    }, []);

    useEffect(() => {
        const listener = () => {
            setListId(window.location.hash.slice(1) as CoID<TodoList>);
        };
        window.addEventListener("hashchange", listener);

        return () => {
            window.removeEventListener("hashchange", listener);
        };
    }, []);

    return (
        <div className="flex flex-col h-full items-center justify-start gap-10 pt-10 md:pt-[30vh] pb-10 px-5">
            {listId ? (
                <TodoList listId={listId} />
            ) : (
                <SubmittableInput
                    onSubmit={createList}
                    label="Create New List"
                    placeholder="New list title"
                />
            )}
            <Button
                onClick={() => {
                    window.location.hash = "";
                    logOut();
                }}
            >
                Log Out
            </Button>
        </div>
    );
}

export function TodoList({ listId }: { listId: CoID<TodoList> }) {
    const list = useTelepathicState(listId);

    const createTask = (text: string) => {
        if (!list) return;
        let task = list.coValue.getTeam().createMap<TaskContent>();

        task = task.edit((task) => {
            task.set("text", text);
            task.set("done", false);
        });

        console.log("Created task", task.id, task.toJSON());

        const listAfter = list.edit((list) => {
            list.set(task.id, true);
        });

        console.log("Updated list", listAfter.toJSON());
    };

    return (
        <div className="max-w-full w-4xl">
            <h1>
                {list?.get("title")} ({list?.id})
            </h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">Done</TableHead>
                        <TableHead>Task</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {list &&
                        list
                            .keys()
                            .filter((key): key is CoID<Task> =>
                                key.startsWith("co_")
                            )
                            .map((taskId) => (
                                <TaskRow key={taskId} taskId={taskId} />
                            ))}
                    <TableRow key="new">
                        <TableCell>
                            <Checkbox className="mt-1" disabled />
                        </TableCell>
                        <TableCell>
                            <SubmittableInput
                                onSubmit={(taskText) => createTask(taskText)}
                                label="Add"
                                placeholder="New task"
                            />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

function TaskRow({ taskId }: { taskId: CoID<Task> }) {
    const task = useTelepathicState(taskId);

    return (
        <TableRow>
            <TableCell>
                <Checkbox
                    className="mt-1"
                    checked={task?.get("done")}
                    onCheckedChange={(checked) => {
                        task?.edit((task) => {
                            task.set("done", !!checked);
                        });
                    }}
                />
            </TableCell>
            <TableCell>
                <div className="flex flex-row justify-between">
                    <span className={task?.get("done") ? "line-through" : ""}>
                        {task?.get("text")}
                    </span>
                    <NameBadge accountID={task?.getLastEditor("text")} />
                </div>
            </TableCell>
        </TableRow>
    );
}

function NameBadge({ accountID }: { accountID?: AccountID }) {
    const profile = useProfile({ accountID });

    return (
        <span className="rounded-full bg-neutral-200 dark:bg-neutral-600 py-0.5 px-2 text-xs text-neutral-500 dark:text-neutral-300">
            {profile?.get("name") || "..."}
        </span>
    );
}

export default App;
