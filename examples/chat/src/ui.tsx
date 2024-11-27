import clsx from "clsx";
import { useId } from "react";

export function AppContainer(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between w-screen h-screen bg-stone-50 dark:bg-black dark:text-white">
      {props.children}
    </div>
  );
}

export function TopBar(props: { children: React.ReactNode }) {
  return (
    <div className="p-3 bg-white w-full flex justify-between gap-2 border-b dark:bg-transparent dark:border-stone-800">
      {props.children}
    </div>
  );
}

export function ChatBody(props: { children: React.ReactNode }) {
  return (
    <div
      className="flex-1 overflow-y-auto flex flex-col-reverse"
      role="application"
    >
      {props.children}
    </div>
  );
}

export function EmptyChatMessage() {
  return (
    <div className="h-full text-base text-stone-500 flex items-center justify-center px-3 text-lg md:text-2xl">
      Start a conversation below.
    </div>
  );
}

export function BubbleContainer(props: {
  children: React.ReactNode;
  fromMe: boolean | undefined;
}) {
  const align = props.fromMe ? "items-end" : "items-start";
  return (
    <div className={`${align} flex flex-col m-3`} role="row">
      {props.children}
    </div>
  );
}

export function BubbleBody(props: {
  children: React.ReactNode;
  fromMe: boolean | undefined;
}) {
  return (
    <div
      className={clsx(
        "line-clamp-10 text-ellipsis whitespace-pre-wrap",
        "rounded-2xl max-w-full py-1 px-3 shadow-sm",
        props.fromMe
          ? "bg-white dark:bg-stone-700 dark:text-white"
          : "bg-blue text-white",
      )}
    >
      {props.children}
    </div>
  );
}

export function BubbleInfo(props: { by: string | undefined; madeAt: Date }) {
  return (
    <div className="text-xs text-neutral-500 mt-1.5">
      {props.by} · {props.madeAt.toLocaleTimeString()}
    </div>
  );
}

export function ChatInput(props: { onSubmit: (text: string) => void }) {
  const inputId = useId();

  return (
    <div className="p-3 bg-white border-t shadow-2xl mt-auto dark:bg-transparent dark:border-stone-800">
      <label className="sr-only" htmlFor={inputId}>
        Type a message and press Enter
      </label>
      <input
        id={inputId}
        className="rounded-full py-2 px-4 border block w-full dark:bg-black dark:text-white dark:border-stone-700"
        placeholder="Type a message and press Enter"
        maxLength={2048}
        onKeyDown={({ key, currentTarget: input }) => {
          if (key !== "Enter" || !input.value) return;
          props.onSubmit(input.value);
          input.value = "";
        }}
      />
    </div>
  );
}
