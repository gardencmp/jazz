import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Checkbox } from "./components/ui/checkbox";

type Todo = {
    done: boolean;
    text: string;
};

function App() {
    return (
        <div className="flex h-full items-center justify-center">
            <TodoList />
        </div>
    );
}

export function TodoList() {
    const [todos, setTodos] = useState<Todo[]>([]);

    return (
        <div className="max-w-full w-4xl">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40px]">Done</TableHead>
                        <TableHead>Task</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {todos.map((todo, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Checkbox
                                    className="mt-1"
                                    checked={todo.done}
                                    onCheckedChange={(checked) => {
                                        setTodos([
                                            ...todos.slice(0, index),
                                            { ...todo, done: !!checked },
                                            ...todos.slice(index + 1),
                                        ]);
                                    }}
                                />
                            </TableCell>
                            <TableCell>{todo.text}</TableCell>
                        </TableRow>
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
                                    setTodos([
                                        ...todos,
                                        { done: false, text: textEl.value },
                                    ]);
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

export default App;
