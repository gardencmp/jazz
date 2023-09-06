import { useCallback, useEffect, useState } from "react";

import { CoMap, CoID, AccountID } from "cojson";
import {
    consumeInviteLinkFromWindowLocation,
    useJazz,
    useProfile,
    useTelepathicState,
    createInviteLink,
} from "jazz-react";

import { SubmittableInput } from "./components/SubmittableInput";
import { useToast } from "./components/ui/use-toast";
import { Skeleton } from "./components/ui/skeleton";
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
import uniqolor from "uniqolor";
import QRCode from "qrcode";
import { CoList } from "cojson/dist/contentTypes/coList";

type Task = CoMap<{ done: boolean; text: string }>;

type ListOfTasks = CoList<CoID<Task>>;

type TodoList = CoMap<{
    title: string;
    tasks: CoID<ListOfTasks>;
}>;

export default function App() {
    const [listId, setListId] = useState<CoID<TodoList>>();

    const { localNode, logOut } = useJazz();

    useEffect(() => {
        const listener = async () => {
            const acceptedInvitation =
                await consumeInviteLinkFromWindowLocation<TodoList>(localNode);

            if (acceptedInvitation) {
                setListId(acceptedInvitation.valueID);
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
            if (!title) return;
            const listGroup = localNode.createGroup();
            const list = listGroup.createMap<TodoList>();
            const tasks = listGroup.createList<ListOfTasks>();

            list.edit((list) => {
                list.set("title", title);
                list.set("tasks", tasks.id);
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
    const tasks = useTelepathicState(list?.get("tasks"));

    const createTask = (text: string) => {
        if (!tasks || !text) return;
        const task = tasks.group.createMap<Task>();

        task.edit((task) => {
            task.set("text", text);
            task.set("done", false);
        });

        tasks.edit((tasks) => {
            tasks.push(task.id);
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
                    {tasks?.map((taskId) => (
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
                        {task?.get("text") || (
                            <Skeleton className="mt-1 w-[200px] h-[1em] rounded-full" />
                        )}
                    </span>
                    <NameBadge accountID={task?.whoEdited("text")} />
                </div>
            </TableCell>
        </TableRow>
    );
}

function NameBadge({ accountID }: { accountID?: AccountID }) {
    const profile = useProfile(accountID);

    const theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    const brightColor = uniqolor(accountID || "", { lightness: 80 }).color;
    const darkColor = uniqolor(accountID || "", { lightness: 20 }).color;

    return profile?.get("name") ? (
        <span
            className="rounded-full py-0.5 px-2 text-xs"
            style={{
                color: theme == "light" ? darkColor : brightColor,
                background: theme == "light" ? brightColor : darkColor,
            }}
        >
            {profile.get("name")}
        </span>
    ) : (
        <Skeleton className="mt-1 w-[50px] h-[1em] rounded-full" />
    );
}

function InviteButton({ list }: { list: TodoList }) {
    const [existingInviteLink, setExistingInviteLink] = useState<string>();
    const { toast } = useToast();

    return (
        list.group.myRole() === "admin" && (
            <Button
                size="sm"
                className="py-0"
                disabled={!list}
                variant="outline"
                onClick={async () => {
                    let inviteLink = existingInviteLink;
                    if (list && !inviteLink) {
                        inviteLink = createInviteLink(list, "writer");
                        setExistingInviteLink(inviteLink);
                    }
                    if (inviteLink) {
                        const qr = await QRCode.toDataURL(inviteLink, {
                            errorCorrectionLevel: "L",
                        });
                        navigator.clipboard.writeText(inviteLink).then(() =>
                            toast({
                                title: "Copied invite link to clipboard!",
                                description: (
                                    <img src={qr} className="w-20 h-20" />
                                ),
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
