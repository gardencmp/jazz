import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { CoMap, CoID } from "cojson";
import { useJazz, useTelepathicState } from "jazz-react";

type TaskContent = { done: boolean; text: string };
type Task = CoMap<TaskContent>;

type TodoListContent = { title: string; [taskId: CoID<Task>]: true };
type TodoList = CoMap<TodoListContent>;

function App() {
    const [listId, setListId] = useState<CoID<TodoList>>(window.location.hash.slice(1) as CoID<TodoList>);

    const { localNode } = useJazz();

    const createList = () => {
        const listTeam = localNode.createTeam();
        const list = listTeam.createMap<TodoListContent, null>();

        list.edit((list) => {
            list.set("title", "My Todo List");
        });

        window.location.hash = list.id;
    };

    useEffect(() => {
        const listener = () => {
            setListId(window.location.hash.slice(1) as CoID<TodoList>);
        }
        window.addEventListener("hashchange", listener);

        return () => {
            window.removeEventListener("hashchange", listener);
        }
    }, [])

    return (
        <div className="flex flex-col h-full items-center justify-center gap-10">
            {listId && <TodoList listId={listId} />}
            <Button onClick={createList}>Create New List</Button>
        </div>
    );
}

export function TodoList({ listId }: { listId: CoID<TodoList> }) {
    const list = useTelepathicState(listId);

    const createTodo = (text: string) => {
        if (!list) return;
        let task = list.coValue.getTeam().createMap<TaskContent, {}>();

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
                                <TodoRow key={taskId} taskId={taskId} />
                            ))}
                    <TableRow key="new">
                        <TableCell>
                            <Checkbox className="mt-1" disabled />
                        </TableCell>
                        <TableCell>
                            <form
                                className="flex flex-row items-center gap-5"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const textEl =
                                        e.currentTarget.elements.namedItem(
                                            "text"
                                        ) as HTMLInputElement;
                                    createTodo(textEl.value);
                                    textEl.value = "";
                                }}
                            >
                                <Input
                                    className="-ml-3 -my-2"
                                    name="text"
                                    placeholder="Add todo"
                                    autoComplete="off"
                                />
                                <Button asChild type="submit">
                                    <Input type="submit" value="Add" />
                                </Button>
                            </form>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

function TodoRow({ taskId }: { taskId: CoID<Task> }) {
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
            <TableCell className={task?.get("done") ? "line-through" : ""}>
                {task?.get("text")}
            </TableCell>
        </TableRow>
    );
}

export default App;
