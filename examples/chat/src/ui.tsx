export function AppContainer(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-between w-screen h-screen bg-stone-50 dark:bg-black dark:text-white">
      {props.children}
    </div>
  );
}

export function TopBar(props: { children: React.ReactNode }) {
  return (
    <div className="mb-5 p-3 bg-white w-full flex justify-end gap-1 text-sm border-b">{props.children}</div>
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
  return <div className="h-full text-base text-stone-500 flex items-center justify-center md:text-xl">Start a conversation below.</div>;
}

export function BubbleContainer(props: {
  children: React.ReactNode;
  fromMe: boolean | undefined;
}) {
  const align = props.fromMe ? "items-end" : "items-start";
  return <div className={`${align} flex flex-col p-3`}>{props.children}</div>;
}

export function BubbleBody(props: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl text-sm bg-white dark:bg-stone-700 dark:text-white py-2 px-4">
      {props.children}
    </div>
  );
}

export function BubbleInfo(props: { by: string | undefined; madeAt: Date }) {
  return (
    <div className="text-xs text-neutral-500 mt-1.5">
      {props.by} ·  {props.madeAt.toLocaleTimeString()}
    </div>
  );
}

export function ChatInput(props: { onSubmit: (text: string) => void }) {
  return (
    <div className="p-3 bg-white border-t shadow-2xl mt-auto">
      <input
        className="rounded-full py-2 px-4 text-sm border block w-full dark:bg-black dark:text-white dark:border-stone-700"
        placeholder="Type a message and press Enter"
        onKeyDown={({ key, currentTarget: input }) => {
          if (key !== "Enter" || !input.value) return;
          props.onSubmit(input.value);
          input.value = "";
        }}
      />
    </div>
  );
}
