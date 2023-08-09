import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Checkbox } from "./components/ui/checkbox";
import { CoMap, CoValueID } from "cojson";
import { Button } from "./components/ui/button";
import { useJazz, useTelepathicState } from "./main";

type TaskContent = { done: boolean; text: string };
type Task = CoMap<TaskContent, {}>;

type TodoListContent = { title: string; [taskId: CoValueID<Task>]: true };
type TodoList = CoMap<TodoListContent, {}>;

function App() {
    const [listId, setListId] = useState<CoValueID<TodoList>>();

    const { localNode } = useJazz();

    const createList = () => {
        const listTeam = localNode.createTeam();
        const list = listTeam.createMap<TodoListContent, {}>();

        list.edit((list) => {
            list.set("title", "My Todo List");
        });

        setListId(list.id);
    };

    return (
        <div className="flex flex-col h-full items-center justify-center gap-10">
            {listId && <TodoList listId={listId} />}
            <Button onClick={createList}>Create New List</Button>
        </div>
    );
}

export function TodoList({ listId }: { listId: CoValueID<TodoList> }) {
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
            <h1>{list?.get("title")}</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">Done</TableHead>
                        <TableHead>Task</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {list &&
                        list.keys()
                            .filter((key): key is CoValueID<Task> =>
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
                                    className="-mx-3 -my-2"
                                    name="text"
                                    placeholder="Add todo"
                                />
                            </form>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

function TodoRow({ taskId }: { taskId: CoValueID<Task> }) {
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
            <TableCell>{task?.get("text")}</TableCell>
        </TableRow>
    );
}

export default App;
