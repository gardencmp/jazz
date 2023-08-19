# Jazz Todo List Example

Live version: https://example-todo.jazz.tools

More comprehensive guide coming soon, but these are the most important bits, with explanations:

From `./src/main.tsx`

```typescript
// ...

import { WithJazz } from "jazz-react";
import { LocalAuth } from "jazz-react-auth-local";

// ...

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider>
            <div className="flex items-center gap-2 justify-center mt-5">
                <img src="jazz-logo.png" className="h-5" /> Jazz Todo List
                Example
            </div>
            <WithJazz
                auth={LocalAuth({
                    appName: "Jazz Todo List Example",
                    Component: PrettyAuthComponent,
                })}
            >
                <App />
            </WithJazz>
        </ThemeProvider>
    </React.StrictMode>
);

```

This shows how to use the top-level component `<WithJazz/>`, which provides the rest of the app with a `LocalNode` (used through `useJazz` later), based on `LocalAuth` that uses Passkeys to store a user's account secret - no backend needed.

Let's move on to the main app code.

---

From `./src/App.tsx`

```typescript
// ...

import { CoMap, CoID, AccountID } from "cojson";
import {
   consumeInviteLinkFromWindowLocation,
   useJazz,
   useProfile,
   useTelepathicState,
   createInviteLink
} from "jazz-react";

// ...

type TaskContent = { done: boolean; text: string };
type Task = CoMap<TaskContent>;

type TodoListContent = {
    title: string;
    // other keys form a set of task IDs
    [taskId: CoID<Task>]: true;
};
type TodoList = CoMap<TodoListContent>;

// ...
```

First, we define our main data model of tasks and todo lists, using CoJSON's collaborative map type, `CoMap`. We reference CoMaps of individual tasks by using them as keys inside the `TodoList` CoMap - as a makeshift solution until `CoList` is implemented.

---

```typescript
// ...

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
```

`<App>` is the main app component, handling client-side routing based on the CoValue ID (`CoID`) of our `TodoList`, stored in the URL hash - which can also contain invite links, which we intercept and use with `consumeInviteLinkFromWindowLocation`.

`createList` is the first time we see CoJSON in action: using our `localNode` (which we got from `useJazz`), we first create a group for a new todo list (which allows us to set permissions later). Then, within that group, we create a new `CoMap<TodoListContent>` with `listGroup.createMap()`.

We immediately start editing the created `list`. Within the edit callback, we can use the `set` function, to collaboratively set the key `title` to the initial title provided to `createList`.

If we have a current `listId` set, we render `<TodoListComponent>` with it, which we'll see next.

If we have no `listId` set, the user can use the displayed creation input to create (and open) their first list.

---

```typescript
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
```

Here in `<TodoListComponent>`, we use `useTelepathicData()` for the first time, in this case to load the CoValue for our `TodoList` and to reactively subscribe to updates to its content - whether we create edits locally, load persisted data, or receive sync updates from other devices or participants!

`createTask` is similar to `createList` we saw earlier, creating a new CoMap for a new task, and then adding it as a key to our `TodoList`.

As you can see, we iterate over the keys of `TodoList` and for those that look like `CoID`s (they always start with `co_`), we render a `<TaskRow>`.

Below all tasks, we render a simple input for adding a task.

---

```typescript
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
```

`<TaskRow>` uses `useTelepathicState()` as well, to granularly load and subscribe to changes for that particular task (the only thing we let the user change is the "done" status).

We also use a `<NameBadge>` helper component to render the name of the author of the task, which we get by using the collaboration feature `getLastEditor(key)` on our `Task` CoMap, which returns the accountID of the last account that changed a given key in the CoMap.

---

```typescript
function NameBadge({ accountID }: { accountID?: AccountID }) {
    const profile = useProfile(accountID);

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
            {profile.get("name")}
        </span>
    );
}
```

`<NameBadge>` uses `useProfile(accountID)`, which is a shorthand for loading an account's profile (which is always a `CoMap<{name: string}>`, but might have app-specific additional properties).

In our case, we just display the profile name (which, by the way, is set by the `LocalAuth` provider when we first create an account).

---

```typescript
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
```

Last, we have a look at the `<InviteButton>` component, which we use inside `<TodoListComponent>`. It only becomes visible when the current user is an admin in the `TodoList`'s group. You can see how we can create an invite link using `createInviteLink(coValue, role)` that allows anyone who has it to join the group as a specified role (here, as a writer).

---

This is the whole Todo List app!

If you have feedback, let us know on [Discord](https://discord.gg/utDMjHYg42) or open an issue or PR to fix something that seems wrong.