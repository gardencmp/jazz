import { useCallback, useEffect, useState } from "react";

import { CoMap, CoID, AccountID } from "cojson";
import {
    consumeInviteLinkFromWindowLocation,
    useJazz,
    useProfile,
    useTelepathicState,
    createInviteLink
} from "jazz-react";

import { SubmittableInput } from "./components/SubmittableInput";
import { useToast } from "./components/ui/use-toast";
import { Skeleton } from "./components/ui/skeleton";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import uniqolor from "uniqolor";

type TaskContent = { done: boolean; text: string };
type Task = CoMap<TaskContent>;

type TodoListContent = {
    title: string;
    // other keys form a set of task IDs
    [taskId: CoID<Task>]: true;
};
type TodoList = CoMap<TodoListContent>;

export default function App() {
    const [listId, setListId] = useState<CoID<TodoList>>();

    const { localNode, logOut } = useJazz();

    useEffect(() => {
        const listener = async () => {
            const acceptedInvitation =
                await consumeInviteLinkFromWindowLocation(localNode);

            if (acceptedInvitation) {
                setListId(acceptedInvitation.valueID as CoID<TodoList>);
                window.location.hash = acceptedInvitation.valueID;
                return;
            }

            setListId(window.location.hash.slice(1) as CoID<TodoList>);
        };
        window.addEventListener("hashchange", listener);
        listener();

        return () => {
            window.removeEventListener("hashchange", listener);
        };
    }, [localNode]);

    const createList = useCallback(
        (title: string) => {
            const listGroup = localNode.createGroup();
            const list = listGroup.createMap<TodoListContent>();

            list.edit((list) => {
                list.set("title", title);
            });

            window.location.hash = list.id;
        },
        [localNode]
    );

    return (
        <div className="flex flex-col h-full items-center justify-start gap-10 pt-10 pb-10 px-5">
            {listId ? (
                <TodoListComponent listId={listId} />
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
                variant="outline"
            >
                Log Out
            </Button>
        </div>
    );
}

export function TodoListComponent({ listId }: { listId: CoID<TodoList> }) {
    const list = useTelepathicState(listId);

    const createTask = (text: string) => {
        if (!list) return;
        const task = list.coValue.getGroup().createMap<TaskContent>();

        task.edit((task) => {
            task.set("text", text);
            task.set("done", false);
        });

        list.edit((list) => {
            list.set(task.id, true);
        });
    };

    return (
        <div className="max-w-full w-4xl">
            <div className="flex justify-between items-center gap-4 mb-4">
                <h1>
                    {list?.get("title") ? (
                        <>
                            {list.get("title")}{" "}
                            <span className="text-sm">({list.id})</span>
                        </>
                    ) : (
                        <Skeleton className="mt-1 w-[200px] h-[1em] rounded-full" />
                    )}
                </h1>
                {list && <InviteButton list={list} />}
            </div>
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
                                disabled={!list}
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
                <div className="flex flex-row justify-between items-center gap-2">
                    <span className={task?.get("done") ? "line-through" : ""}>
                        {task?.get("text") || <Skeleton className="mt-1 w-[200px] h-[1em] rounded-full" />}
                    </span>
                    <NameBadge accountID={task?.getLastEditor("text")} />
                </div>
            </TableCell>
        </TableRow>
    );
}

function NameBadge({ accountID }: { accountID?: AccountID }) {
    const profile = useProfile({ accountID });

    const theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    const brightColor = uniqolor(accountID || "", { lightness: 80 }).color;
    const darkColor = uniqolor(accountID || "", { lightness: 20 }).color;

    return (
        profile?.get("name") && <span
            className="rounded-full py-0.5 px-2 text-xs"
            style={{
                color: theme == "light" ? darkColor : brightColor,
                background: theme == "light" ? brightColor : darkColor,
            }}
        >
            {profile?.get("name")}
        </span>
    );
}

function InviteButton({ list }: { list: TodoList }) {
    const [existingInviteLink, setExistingInviteLink] = useState<string>();
    const { toast } = useToast();

    return (
        list.coValue.getGroup().myRole() === "admin" && (
            <Button
                size="sm"
                className="py-0"
                disabled={!list}
                variant="outline"
                onClick={() => {
                    let inviteLink = existingInviteLink;
                    if (list && !inviteLink) {
                        inviteLink = createInviteLink(list, "writer");
                        setExistingInviteLink(inviteLink);
                    }
                    if (inviteLink) {
                        navigator.clipboard.writeText(inviteLink).then(() =>
                            toast({
                                description: "Copied invite link to clipboard!",
                            })
                        );
                    }
                }}
            >
                Invite
            </Button>
        )
    );
}