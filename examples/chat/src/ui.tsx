export function AppContainer(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-between w-screen h-screen p-2 dark:bg-black dark:text-white">
      {props.children}
    </div>
  );
}

export function TopBar(props: { children: React.ReactNode }) {
  return (
    <div className="mb-5 px-2 py-1 text-sm self-end">{props.children}</div>
  );
}

export function ChatContainer(props: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-xl h-full flex flex-col items-stretch">
      {props.children}
    </div>
  );
}

export function EmptyChatMessage() {
  return <div className="m-auto text-sm">(Empty chat)</div>;
}

export function BubbleContainer(props: {
  children: React.ReactNode;
  fromMe: boolean | undefined;
}) {
  const align = props.fromMe ? "items-end" : "items-start";
  return <div className={`${align} flex flex-col`}>{props.children}</div>;
}

export function BubbleBody(props: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-stone-100 dark:bg-stone-700 dark:text-white py-2 px-4 mt-2 min-w-[5rem]">
      {props.children}
    </div>
  );
}

export function BubbleInfo(props: { by: string | undefined; madeAt: Date }) {
  return (
    <div className="text-xs text-neutral-500 ml-2">
      {props.by} {props.madeAt.toLocaleTimeString()}
    </div>
  );
}

export function ChatInput(props: { onSubmit: (text: string) => void }) {
  return (
    <input
      className="rounded p-2 border mt-auto dark:bg-black dark:text-white border-stone-300 dark:border-stone-700"
      placeholder="Type a message and press Enter"
      onKeyDown={({ key, currentTarget: input }) => {
        if (key !== "Enter" || !input.value) return;
        props.onSubmit(input.value);
        input.value = "";
      }}
    />
  );
}
